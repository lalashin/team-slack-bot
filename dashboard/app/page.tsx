import Dashboard from '@/components/Dashboard';
import type { BotStatus, ChartDataPoint, ChartSummary, LogEntry, MessageStats } from '@/types/dashboard';

/** 목업 — 실제로는 GET /api/dashboard/* 및 WebSocket 과 연동 */
const mockBotStatus: BotStatus = {
  isOnline: true,
  uptime: 43200,
  lastSyncAt: new Date().toISOString(),
  memoryUsage: { usedMB: 250, totalMB: 512 },
  connectionStatus: 'connected',
};

const mockStats: MessageStats = {
  totalMessages: 342,
  totalCommands: 28,
  totalEvents: 156,
  topChannel: { name: 'general', count: 125 },
  peakHour: { hour: 14, count: 45 },
};

const mockChart: ChartDataPoint[] = [
  { date: '2026-04-05', dayOfWeek: 'Mon', messages: 280, commands: 24, events: 142 },
  { date: '2026-04-06', dayOfWeek: 'Tue', messages: 290, commands: 22, events: 138 },
  { date: '2026-04-07', dayOfWeek: 'Wed', messages: 310, commands: 26, events: 150 },
  { date: '2026-04-08', dayOfWeek: 'Thu', messages: 265, commands: 20, events: 130 },
  { date: '2026-04-09', dayOfWeek: 'Fri', messages: 300, commands: 25, events: 148 },
  { date: '2026-04-10', dayOfWeek: 'Sat', messages: 180, commands: 15, events: 90 },
  { date: '2026-04-11', dayOfWeek: 'Sun', messages: 342, commands: 28, events: 156 },
];

const mockSummary: ChartSummary = {
  averagePerDay: 305,
  totalWeek: 2135,
  trend: 'up',
  trendPercent: 12,
};

const mockLogs: LogEntry[] = [
  {
    id: 'log-001',
    type: 'command',
    channel: '#general',
    message: 'command_todo: 새 작업 정리',
    userId: 'U12345',
    timestamp: new Date().toISOString(),
    status: 'success',
  },
  {
    id: 'log-002',
    type: 'message',
    channel: '#C01234',
    message: 'app_mention: 도움말 요청',
    userId: 'U23456',
    timestamp: new Date().toISOString(),
    status: 'success',
  },
  {
    id: 'log-003',
    type: 'event',
    channel: '—',
    message: 'task_created',
    userId: 'U12345',
    timestamp: new Date().toISOString(),
    status: 'success',
  },
];

export default function HomePage() {
  return (
    <Dashboard
      botStatus={mockBotStatus}
      messageStats={mockStats}
      statsPeriod="today"
      chartData={mockChart}
      chartSummary={mockSummary}
      logs={mockLogs}
    />
  );
}
