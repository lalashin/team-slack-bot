const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config/slack');
const logger = require('../logger');
const { run, all } = require('./sql');

let db;

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

async function initializeDatabase() {
  const resolved = path.resolve(config.dbPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await new Promise((resolve, reject) => {
    db = new sqlite3.Database(resolved, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await run(db, 'PRAGMA foreign_keys = ON');

  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      slack_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      display_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  );

  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'done')),
      slack_channel_id TEXT,
      slack_message_ts TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
  );

  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS events_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      user_id TEXT,
      task_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)`,
  );

  await migrateLegacyTasksTable(db);

  logger.info({ path: resolved }, 'SQLite initialized');
}

/** Older DB files may lack columns added after first deploy. */
async function migrateLegacyTasksTable(database) {
  const cols = await all(database, `PRAGMA table_info(tasks)`);
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('slack_channel_id')) {
    await run(database, `ALTER TABLE tasks ADD COLUMN slack_channel_id TEXT`);
  }
  if (!names.has('slack_message_ts')) {
    await run(database, `ALTER TABLE tasks ADD COLUMN slack_message_ts TEXT`);
  }
}

function closeDatabase() {
  if (!db) return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else {
        db = null;
        resolve();
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
};
