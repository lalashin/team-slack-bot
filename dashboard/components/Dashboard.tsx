'use client';

import * as React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
  BotStatus,
  ChartDataPoint,
  ChartSummary,
  LogEntry,
  LogEntryType,
  MessageStats,
} from '@/types/dashboard';

const CHART_COLORS = {
  messages: 'hsl(217 91% 60%)',
  commands: 'hsl(142 76% 45%)',
  events: 'hsl(47 96% 53%)',
} as const;

export interface DashboardProps {
  botStatus: BotStatus;
  messageStats: MessageStats;
  /** `GET /api/dashboard/message-stats?period=` 과 동일 */
  statsPeriod?: 'today' | 'week' | 'month';
  chartData: ChartDataPoint[];
  chartSummary: ChartSummary;
  logs: LogEntry[];
  className?: string;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** SSR/CSR 동일 문자열 보장 — `toLocaleString()` 단독 사용 시 hydration 불일치 방지 */
const dashboardDateTime = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
});

function formatDashboardDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dashboardDateTime.format(d);
}

function BotStatusCard({ botStatus }: { botStatus: BotStatus }) {
  const memPct =
    botStatus.memoryUsage.totalMB > 0
      ? (botStatus.memoryUsage.usedMB / botStatus.memoryUsage.totalMB) * 100
      : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle
            className={cn('h-3 w-3 fill-current', botStatus.isOnline ? 'text-emerald-500' : 'text-red-500')}
            aria-hidden
          />
          Bot Status
        </CardTitle>
        <CardDescription>실시간 상태 모니터링 · Socket Mode / Bolt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">상태</span>
          <Badge variant={botStatus.isOnline ? 'default' : 'destructive'}>
            {botStatus.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">가동 시간</span>
          <span className="text-sm text-muted-foreground">{formatUptime(botStatus.uptime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">마지막 동기화</span>
          <span className="text-sm text-muted-foreground">{formatDashboardDateTime(botStatus.lastSyncAt)}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">메모리</span>
            <span className="text-muted-foreground">
              {botStatus.memoryUsage.usedMB} / {botStatus.memoryUsage.totalMB} MB
            </span>
          </div>
          <Progress value={memPct} max={100} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">연결</span>
          <Badge variant="outline" className="capitalize">
            {botStatus.connectionStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageStatsCards({ stats, period }: { stats: MessageStats; period: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">메시지</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tabular-nums">{stats.totalMessages}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.topChannel
              ? `최다 채널: ${stats.topChannel.name} (${stats.topChannel.count})`
              : '집계 기간 내 멘션·DM 등 메시지 유입'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">명령어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tabular-nums">{stats.totalCommands}</div>
          <p className="mt-2 text-xs text-muted-foreground">실행된 슬래시 명령 (/todo, /list, /status, /help)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">이벤트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tabular-nums">{stats.totalEvents}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.peakHour
              ? `피크: ${stats.peakHour.hour}시 (${stats.peakHour.count}건)`
              : '처리된 Slack 이벤트·작업 로그'}
          </p>
        </CardContent>
      </Card>
      <p className="col-span-full text-xs text-muted-foreground sm:col-span-3">집계: {period}</p>
    </div>
  );
}

function MessageTrendChart({ data, summary }: { data: ChartDataPoint[]; summary: ChartSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>메시지 유입 추이 (7일)</CardTitle>
        <CardDescription>일별 메시지, 명령어, 이벤트 — Recharts BarChart</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 3.7% 18%)" vertical={false} />
              <XAxis dataKey="dayOfWeek" stroke="hsl(240 5% 64.9%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 5% 64.9%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(240 3.7% 15.9% / 0.35)' }}
                contentStyle={{
                  backgroundColor: 'hsl(240 10% 5.5%)',
                  border: '1px solid hsl(240 3.7% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(0 0% 98%)',
                }}
                labelStyle={{ color: 'hsl(240 5% 64.9%)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="messages" name="메시지" fill={CHART_COLORS.messages} radius={[4, 4, 0, 0]} />
              <Bar dataKey="commands" name="명령어" fill={CHART_COLORS.commands} radius={[4, 4, 0, 0]} />
              <Bar dataKey="events" name="이벤트" fill={CHART_COLORS.events} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">평균 (일일)</p>
            <p className="text-lg font-bold tabular-nums">{summary.averagePerDay}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">주간 합계</p>
            <p className="text-lg font-bold tabular-nums">{summary.totalWeek}</p>
          </div>
          <div className="col-span-2 flex flex-col gap-1 md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">추이</p>
            <Badge
              variant={summary.trend === 'up' ? 'default' : summary.trend === 'down' ? 'secondary' : 'outline'}
              className="w-fit"
            >
              {summary.trend === 'up' ? '↑' : summary.trend === 'down' ? '↓' : '→'}{' '}
              {Math.abs(summary.trendPercent)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const columnHelper = createColumnHelper<LogEntry>();

function LogTableCard({ logs }: { logs: LogEntry[] }) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | LogEntryType>('all');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const filtered = React.useMemo(() => {
    return logs.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (!globalFilter.trim()) return true;
      const q = globalFilter.toLowerCase();
      return (
        row.message.toLowerCase().includes(q) ||
        row.channel.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q)
      );
    });
  }, [logs, typeFilter, globalFilter]);

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="전체 선택"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label="행 선택"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-primary"
          />
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => {
          const t = info.getValue();
          const icon = t === 'message' ? '💬' : t === 'command' ? '⌘' : t === 'event' ? '⚡' : '❌';
          return (
            <Badge variant="outline" className="font-normal">
              {icon} {t}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('channel', {
        header: 'Channel',
        cell: (info) => (
          <code className="rounded bg-muted px-2 py-1 text-xs text-foreground">{info.getValue()}</code>
        ),
      }),
      columnHelper.accessor('message', {
        header: 'Message',
        cell: (info) => {
          const msg = info.getValue();
          return (
            <span className="block max-w-[min(28rem,50vw)] truncate text-sm" title={msg}>
              {msg.length > 80 ? `${msg.slice(0, 80)}…` : msg}
            </span>
          );
        },
      }),
      columnHelper.accessor('timestamp', {
        header: 'Time',
        cell: (info) => formatDashboardDateTime(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const v = info.getValue();
          return (
            <Badge
              variant={v === 'success' ? 'default' : v === 'pending' ? 'secondary' : 'destructive'}
              className="capitalize"
            >
              {v}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button type="button" variant="ghost" size="sm">
            View
          </Button>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 로그</CardTitle>
        <CardDescription>events_log·API와 동일 스키마로 표시 (WebSocket `log-added` 연동 가능)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="메시지·채널·사용자 검색…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | LogEntryType)}
            className="flex h-9 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto"
            aria-label="로그 유형 필터"
          >
            <option value="all">모든 유형</option>
            <option value="message">message</option>
            <option value="command">command</option>
            <option value="event">event</option>
            <option value="error">error</option>
          </select>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    로그가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            페이지 {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              이전
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Team Slack Bot 모니터링 대시보드 — PRD·dashboard_spec 과 동일 API·타입.
 * 상위에서 `fetch('/api/dashboard/...')` 또는 Socket.io로 데이터를 넣거나,
 * `mapSlackBotEventRowToLogEntry` 로 SQLite `events_log` 를 변환해 `logs` 에 전달하세요.
 */
export function Dashboard({
  botStatus,
  messageStats,
  statsPeriod = 'today',
  chartData,
  chartSummary,
  logs,
  className,
}: DashboardProps) {
  const periodLabel =
    statsPeriod === 'today' ? '오늘' : statsPeriod === 'week' ? '이번 주' : '이번 달';

  return (
    <div className={cn('min-h-screen bg-background p-4 text-foreground md:p-8', className)}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team Slack Bot Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            봇 상태 · 메시지/명령/이벤트 통계 · 7일 추이 · 로그 (11교시 Bolt 봇 데이터와 동일 인터페이스)
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <BotStatusCard botStatus={botStatus} />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <MessageStatsCards stats={messageStats} period={periodLabel} />
          </div>
        </section>

        <section>
          <MessageTrendChart data={chartData} summary={chartSummary} />
        </section>

        <section>
          <LogTableCard logs={logs} />
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
