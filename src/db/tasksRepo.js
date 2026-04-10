const { getDb } = require('./init');
const { run, get, all } = require('./sql');
const logger = require('../logger');

/** 보고서 항목 2 — JSON 메타데이터 안전 직렬화 (2026-04-10) */
function safeStringifyMetadata(metadata) {
  try {
    if (metadata === undefined || metadata === null) return null;
    if (typeof metadata === 'string') return metadata;

    const seen = new WeakSet();
    return JSON.stringify(metadata, (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (value instanceof Map) return Object.fromEntries(value);
      if (value instanceof Set) return [...value];
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to stringify metadata for events_log');
    return JSON.stringify({ error: 'serialization_failed' });
  }
}

function nextTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapTaskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slackChannelId: row.slack_channel_id,
    slackMessageTs: row.slack_message_ts,
  };
}

async function ensureUser(slackUserId) {
  const db = getDb();
  await run(
    db,
    `INSERT OR IGNORE INTO users (id, slack_id, username, display_name)
     VALUES (?, ?, ?, ?)`,
    [slackUserId, slackUserId, slackUserId, null],
  );
}

async function insertEvent({ eventType, userId, taskId, metadata }) {
  const db = getDb();
  const meta = safeStringifyMetadata(metadata);
  await run(db, `INSERT INTO events_log (event_type, user_id, task_id, metadata) VALUES (?, ?, ?, ?)`, [
    eventType,
    userId || null,
    taskId || null,
    meta,
  ]);
}

async function createTask({ userId, title }) {
  const db = getDb();
  await ensureUser(userId);
  const id = nextTaskId();
  const trimmed = title.trim();
  await run(
    db,
    `INSERT INTO tasks (id, user_id, title, status) VALUES (?, ?, ?, 'open')`,
    [id, userId, trimmed],
  );
  await insertEvent({
    eventType: 'task_created',
    userId,
    taskId: id,
    metadata: { title: trimmed },
  });
  const row = await get(
    db,
    `SELECT id, user_id, title, status, created_at, updated_at, slack_channel_id, slack_message_ts FROM tasks WHERE id = ?`,
    [id],
  );
  return mapTaskRow(row);
}

async function listTasks({ status, userId } = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (userId) {
    clauses.push('user_id = ?');
    params.push(userId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await all(
    db,
    `SELECT id, user_id, title, status, created_at, updated_at, slack_channel_id, slack_message_ts
     FROM tasks ${where}
     ORDER BY datetime(created_at) ASC`,
    params,
  );
  return rows.map(mapTaskRow);
}

async function countTasks() {
  const db = getDb();
  const row = await get(db, `SELECT COUNT(*) AS c FROM tasks`);
  return row ? row.c : 0;
}

async function getTask(taskId) {
  const db = getDb();
  const row = await get(
    db,
    `SELECT id, user_id, title, status, created_at, updated_at, slack_channel_id, slack_message_ts
     FROM tasks WHERE id = ?`,
    [taskId],
  );
  return mapTaskRow(row);
}

async function updateTask(taskId, updates) {
  const db = getDb();
  const allowed = ['title', 'status', 'description', 'due_date', 'slack_channel_id', 'slack_message_ts'];
  const setClauses = [];
  const params = [];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const col = key;
      setClauses.push(`${col} = ?`);
      params.push(updates[key]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('updateTask: no valid fields to update');
  }

  setClauses.push(`updated_at = datetime('now')`);
  params.push(taskId);

  const result = await run(
    db,
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
    params,
  );

  if (result.changes === 0) {
    return null;
  }

  await insertEvent({
    eventType: 'task_updated',
    taskId,
    metadata: updates,
  });

  return getTask(taskId);
}

async function deleteTask(taskId) {
  const db = getDb();
  const existing = await getTask(taskId);
  if (!existing) {
    return false;
  }

  await insertEvent({
    eventType: 'task_deleted',
    taskId,
    metadata: { title: existing.title },
  });

  const result = await run(db, `DELETE FROM tasks WHERE id = ?`, [taskId]);
  return result.changes > 0;
}

/**
 * If a task was posted with slack_message_ts, mark done when reaction matches.
 */
async function updateTaskStatusBySlackMessage({ channel, messageTs, status }) {
  const db = getDb();
  const result = await run(
    db,
    `UPDATE tasks SET status = ?, updated_at = datetime('now')
     WHERE slack_channel_id = ? AND slack_message_ts = ?`,
    [status, channel, messageTs],
  );
  return result.changes || 0;
}

module.exports = {
  createTask,
  listTasks,
  countTasks,
  getTask,
  updateTask,
  deleteTask,
  insertEvent,
  updateTaskStatusBySlackMessage,
};
