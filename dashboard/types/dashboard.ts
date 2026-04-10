/**
 * Dashboard API contracts — aligned with `dashboard_spec.md` and
 * `docs/01-plan/features/team-slack-bot.plan.md`.
 *
 * Backend mapping: 11교시 Slack 봇은 `events_log` / `dataService.logEvent` 로
 * command_*, app_mention, task_* 등을 기록합니다. 아래 `SlackBotEventLogRow` 및
 * 매퍼로 REST 응답 `LogEntry` 형태로 변환할 수 있습니다.
 */

export interface BotStatus {
  isOnline: boolean;
  uptime: number;
  lastSyncAt: string;
  memoryUsage: {
    usedMB: number;
    totalMB: number;
  };
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface BotStatusResponse {
  success: boolean;
  data: BotStatus;
  timestamp: string;
}

export interface MessageStats {
  totalMessages: number;
  totalCommands: number;
  totalEvents: number;
  topChannel?: { name: string; count: number };
  peakHour?: { hour: number; count: number };
}

export interface MessageStatsResponse {
  success: boolean;
  data: MessageStats;
  period: 'today' | 'week' | 'month';
}

export interface ChartDataPoint {
  date: string;
  dayOfWeek: string;
  messages: number;
  commands: number;
  events: number;
}

export interface ChartSummary {
  averagePerDay: number;
  totalWeek: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface MessageTrendResponse {
  success: boolean;
  data: ChartDataPoint[];
  summary: ChartSummary;
}

export type LogEntryType = 'message' | 'command' | 'event' | 'error';

export interface LogEntry {
  id: string;
  type: LogEntryType;
  channel: string;
  message: string;
  userId: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export interface LogResponse {
  success: boolean;
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  error?: string;
}

/** SQLite `events_log` 행 — `src/db/init.js` 스키마와 동일 */
export interface SlackBotEventLogRow {
  id: number;
  event_type: string;
  user_id: string | null;
  task_id: string | null;
  metadata: string | null;
  created_at: string;
}

/**
 * 봇에서 쓰는 event_type → 대시보드 LogEntry.type
 * (handlers: command_todo, command_list, command_status, app_mention, reaction_added, task_* …)
 */
export function mapSlackBotEventTypeToLogType(eventType: string): LogEntryType {
  if (eventType.startsWith('command_')) return 'command';
  if (eventType === 'error' || eventType.endsWith('_error')) return 'error';
  if (eventType === 'app_mention' || eventType === 'message') return 'message';
  return 'event';
}

function safeParseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatChannel(meta: Record<string, unknown>): string {
  const ch = meta.channel;
  if (typeof ch === 'string' && ch.length > 0) {
    return ch.startsWith('#') ? ch : `#${ch}`;
  }
  return '—';
}

function deriveMessage(eventType: string, meta: Record<string, unknown>): string {
  const title = meta.title;
  if (typeof title === 'string' && title.length > 0) {
    return `${eventType}: ${title}`;
  }
  const text = meta.text;
  if (typeof text === 'string' && text.length > 0) {
    return `${eventType}: ${text.slice(0, 120)}`;
  }
  const filter = meta.filter;
  if (typeof filter === 'string') {
    return `${eventType} (filter: ${filter})`;
  }
  const taskCount = meta.taskCount;
  if (typeof taskCount === 'number') {
    return `${eventType} (tasks: ${taskCount})`;
  }
  const resultCount = meta.resultCount;
  if (typeof resultCount === 'number') {
    return `${eventType} (results: ${resultCount})`;
  }
  return eventType;
}

function normalizeSqliteDatetime(createdAt: string): string {
  if (createdAt.includes('T')) {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? createdAt : d.toISOString();
  }
  const d = new Date(createdAt.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? createdAt : d.toISOString();
}

/** API 레이어에서 `events_log` 한 행을 `LogEntry`로 변환 */
export function mapSlackBotEventRowToLogEntry(row: SlackBotEventLogRow): LogEntry {
  const meta = safeParseMetadata(row.metadata);
  const type = mapSlackBotEventTypeToLogType(row.event_type);
  return {
    id: `log-${row.id}`,
    type,
    channel: formatChannel(meta),
    message: deriveMessage(row.event_type, meta),
    userId: row.user_id ?? '—',
    timestamp: normalizeSqliteDatetime(row.created_at),
    status: type === 'error' ? 'failed' : 'success',
  };
}
