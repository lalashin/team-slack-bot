# Team Slack Bot — Dashboard Specification

**작성일**: 2026-04-11  
**기준**: Shadcn/UI 공식 문서 + TanStack Table 공식 가이드 + Recharts 공식 예제  
**기술스택**: Next.js + TypeScript + Shadcn/UI + TanStack Table + Recharts  
**실시간**: WebSocket (Socket.io / ws)

---

## 📋 Executive Summary

| 항목 | 상세 |
|------|------|
| **대시보드 목표** | Slack 봇의 상태, 메시지 통계, 실시간 로그를 한눈에 모니터링 |
| **주요 섹션** | Bot Status (상태), Message Stats (통계), Message Trend (차트), Log Table (로그) |
| **기술 근거** | [Shadcn/UI Card](https://ui.shadcn.com/docs/components/base/card), [TanStack Table](https://tanstack.com/table), [Recharts BarChart](https://recharts.org/) |
| **검증 상태** | ✅ 공식 문서 기반 (Context7 출처 검증 완료) |

---

## 1️⃣ BotStatusCard — 봇 상태 모니터링

### 📌 데이터 인터페이스

```typescript
/**
 * Slack 봇의 실시간 상태 정보
 * 출처: Slack Bolt Socket Mode Best Practices
 */
interface BotStatus {
  isOnline: boolean;              // 온/오프라인 상태
  uptime: number;                 // 초 단위 가동 시간
  lastSyncAt: string;             // ISO8601 타임스탐프
  memoryUsage: {
    usedMB: number;
    totalMB: number;
  };
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

/**
 * API 응답 구조
 */
interface BotStatusResponse {
  success: boolean;
  data: BotStatus;
  timestamp: string;
}
```

### 🎨 Shadcn/UI Card 구조 (공식 문서 기반)

**출처**: https://ui.shadcn.com/docs/components/base/card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BotStatusCard({ botStatus }: { botStatus: BotStatus }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className={`h-3 w-3 ${botStatus.isOnline ? 'fill-green-500' : 'fill-red-500'}`} />
          Bot Status
        </CardTitle>
        <CardDescription>실시간 상태 모니터링</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상태 배지 */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">상태</span>
          <Badge variant={botStatus.isOnline ? 'default' : 'destructive'}>
            {botStatus.isOnline ? '🟢 Online' : '🔴 Offline'}
          </Badge>
        </div>

        {/* 가동 시간 */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">가동 시간</span>
          <span className="text-sm">{formatUptime(botStatus.uptime)}</span>
        </div>

        {/* 마지막 동기화 */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">마지막 동기화</span>
          <span className="text-sm">{formatTime(botStatus.lastSyncAt)}</span>
        </div>

        {/* 메모리 사용량 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">메모리</span>
            <span>{botStatus.memoryUsage.usedMB} / {botStatus.memoryUsage.totalMB} MB</span>
          </div>
          <ProgressBar 
            value={(botStatus.memoryUsage.usedMB / botStatus.memoryUsage.totalMB) * 100} 
          />
        </div>

        {/* 연결 상태 */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">연결</span>
          <Badge variant="outline">
            {botStatus.connectionStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 🔌 WebSocket 이벤트 (실시간 업데이트)

```typescript
/**
 * 봇 상태 변경 시 클라이언트로 브로드캐스트
 * 출처: Socket.io / ws 공식 패턴
 */
socket.on('bot-status-changed', (status: BotStatus) => {
  // UI 업데이트
  setBotStatus(status);
});
```

### 📡 REST API Endpoint

```bash
GET /api/dashboard/bot-status

# 응답
{
  "success": true,
  "data": {
    "isOnline": true,
    "uptime": 43200,
    "lastSyncAt": "2026-04-11T10:30:00Z",
    "memoryUsage": {
      "usedMB": 250,
      "totalMB": 512
    },
    "connectionStatus": "connected"
  },
  "timestamp": "2026-04-11T10:31:45Z"
}
```

---

## 2️⃣ MessageStatsCard — 일일 통계

### 📌 데이터 인터페이스

```typescript
interface MessageStats {
  totalMessages: number;          // 총 메시지 수
  totalCommands: number;          // 실행된 명령어 수
  totalEvents: number;            // 처리된 이벤트 수
  topChannel?: {
    name: string;
    count: number;
  };
  peakHour?: {
    hour: number;
    count: number;
  };
}

interface MessageStatsResponse {
  success: boolean;
  data: MessageStats;
  period: 'today' | 'week' | 'month';
}
```

### 🎨 3개 카드 레이아웃

```tsx
export function MessageStatsCard({ stats }: { stats: MessageStats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 메시지 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">메시지</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalMessages}</div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.totalMessages > 0 ? '📈 +5% from yesterday' : 'No messages'}
          </p>
        </CardContent>
      </Card>

      {/* 명령어 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">명령어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalCommands}</div>
          <p className="text-xs text-gray-500 mt-2">실행된 슬래시 명령어</p>
        </CardContent>
      </Card>

      {/* 이벤트 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">이벤트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalEvents}</div>
          <p className="text-xs text-gray-500 mt-2">처리된 Slack 이벤트</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 📡 REST API Endpoint

```bash
GET /api/dashboard/message-stats?period=today

# 응답
{
  "success": true,
  "data": {
    "totalMessages": 342,
    "totalCommands": 28,
    "totalEvents": 156,
    "topChannel": {
      "name": "general",
      "count": 125
    },
    "peakHour": {
      "hour": 14,
      "count": 45
    }
  },
  "period": "today"
}
```

---

## 3️⃣ MessageTrendChart — 7일 추이 차트

### 📌 데이터 인터페이스

```typescript
/**
 * 일일 메시지 통계 (Recharts 호환)
 * 출처: https://recharts.org/api/BarChart
 */
interface ChartDataPoint {
  date: string;          // YYYY-MM-DD
  dayOfWeek: string;     // "Mon", "Tue", ...
  messages: number;
  commands: number;
  events: number;
}

interface ChartSummary {
  averagePerDay: number;
  totalWeek: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}
```

### 🎨 Recharts BarChart 구현 (공식 문서 기반)

**출처**: https://context7.com/recharts/recharts/llms.txt

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function MessageTrendChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>메시지 유입 추이 (7일)</CardTitle>
        <CardDescription>일별 메시지, 명령어, 이벤트 통계</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dayOfWeek" 
              stroke="#888888"
            />
            <YAxis />
            <Tooltip 
              wrapperStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}
            />
            <Legend />
            <Bar dataKey="messages" fill="#8884d8" />
            <Bar dataKey="commands" fill="#82ca9d" />
            <Bar dataKey="events" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>

        {/* 차트 요약 */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium">평균 (일일)</p>
            <p className="text-lg font-bold">{summary.averagePerDay}</p>
          </div>
          <div>
            <p className="text-sm font-medium">주간 합계</p>
            <p className="text-lg font-bold">{summary.totalWeek}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium">추이</p>
            <Badge variant={summary.trend === 'up' ? 'default' : 'secondary'}>
              {summary.trend === 'up' ? '📈' : summary.trend === 'down' ? '📉' : '→'} 
              {Math.abs(summary.trendPercent)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 📡 REST API Endpoint

```bash
GET /api/dashboard/message-trend?days=7

# 응답
{
  "success": true,
  "data": [
    {
      "date": "2026-04-05",
      "dayOfWeek": "Mon",
      "messages": 280,
      "commands": 24,
      "events": 142
    },
    // ... 7일치 데이터
    {
      "date": "2026-04-11",
      "dayOfWeek": "Sun",
      "messages": 342,
      "commands": 28,
      "events": 156
    }
  ],
  "summary": {
    "averagePerDay": 305,
    "totalWeek": 2135,
    "trend": "up",
    "trendPercent": 12
  }
}
```

---

## 4️⃣ LogTable — 실시간 로그 테이블

### 📌 데이터 인터페이스

```typescript
/**
 * 봇 작업 로그 엔트리
 */
interface LogEntry {
  id: string;                    // 고유 ID
  type: 'message' | 'command' | 'event' | 'error';
  channel: string;               // #general, #random, etc.
  message: string;               // 로그 메시지
  userId: string;                // Slack User ID
  timestamp: string;             // ISO8601
  status: 'success' | 'pending' | 'failed';
}

interface LogResponse {
  success: boolean;
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### 🎨 TanStack Table 구현 (공식 문서 기반)

**출처**: https://context7.com/tanstack/table/llms.txt

```tsx
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const columnHelper = createColumnHelper<LogEntry>()

const columns = [
  // 선택 체크박스
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),

  // Type 컬럼
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => (
      <Badge variant="outline">
        {info.getValue() === 'message' && '💬'}
        {info.getValue() === 'command' && '⌘'}
        {info.getValue() === 'event' && '⚡'}
        {info.getValue() === 'error' && '❌'}
        {' ' + info.getValue()}
      </Badge>
    ),
  }),

  // Channel 컬럼
  columnHelper.accessor('channel', {
    header: 'Channel',
    cell: (info) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
        {info.getValue()}
      </code>
    ),
  }),

  // Message 컬럼 (truncated)
  columnHelper.accessor('message', {
    header: 'Message',
    cell: (info) => {
      const msg = info.getValue()
      return (
        <span className="truncate max-w-xs" title={msg}>
          {msg.length > 50 ? msg.substring(0, 50) + '...' : msg}
        </span>
      )
    },
  }),

  // Timestamp 컬럼
  columnHelper.accessor('timestamp', {
    header: 'Time',
    cell: (info) => new Date(info.getValue()).toLocaleTimeString(),
  }),

  // Status 컬럼
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge
        variant={
          info.getValue() === 'success'
            ? 'default'
            : info.getValue() === 'pending'
            ? 'secondary'
            : 'destructive'
        }
      >
        {info.getValue()}
      </Badge>
    ),
  }),

  // Actions 컬럼
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => (
      <Button variant="ghost" size="sm">
        View
      </Button>
    ),
  }),
]

export function LogTable({ logs }: { logs: LogEntry[] }) {
  const [data] = React.useState(logs)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 로그</CardTitle>
        <CardDescription>최근 봇 작업 기록</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 필터 영역 */}
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="메시지 검색..."
            value={(columnFilters[0]?.value as string) || ''}
            onChange={(e) =>
              setColumnFilters([{ id: 'message', value: e.target.value }])
            }
            className="max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Type Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuItem>Command</DropdownMenuItem>
              <DropdownMenuItem>Event</DropdownMenuItem>
              <DropdownMenuItem>Error</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-4">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 📡 REST API Endpoint

```bash
GET /api/dashboard/logs?page=1&limit=10&type=all&channel=all

# 응답
{
  "success": true,
  "data": [
    {
      "id": "log-001",
      "type": "message",
      "channel": "#general",
      "message": "User message added",
      "userId": "U12345",
      "timestamp": "2026-04-11T10:31:45Z",
      "status": "success"
    },
    // ... 추가 로그
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 342
  }
}
```

### 🔌 WebSocket 이벤트 (실시간 업데이트)

```typescript
/**
 * 새 로그가 생성되면 클라이언트로 브로드캐스트
 */
socket.on('log-added', (logEntry: LogEntry) => {
  // 테이블 상단에 새 로그 추가
  setLogs((prev) => [logEntry, ...prev].slice(0, 10));
});

socket.on('log-updated', (logEntry: LogEntry) => {
  // 기존 로그 업데이트 (예: 상태 변경)
  setLogs((prev) =>
    prev.map((log) => (log.id === logEntry.id ? logEntry : log))
  );
});
```

---

## 5️⃣ 전체 데이터 아키텍처 & 구현 가이드

### 🔄 데이터 흐름 다이어그램

```
┌─────────────────────────┐
│  Slack Bot Backend      │
│  (Node.js + Slack Bolt) │
└────────────┬────────────┘
             │ WebSocket (Socket.io)
             │ REST API (Express)
             ▼
┌─────────────────────────┐
│  Dashboard API Server   │
│  (REST + WebSocket)     │
└────────────┬────────────┘
             │ HTTP / WS
             ▼
┌─────────────────────────┐
│  Frontend Dashboard     │
│  (Next.js + React)      │
│  ┌─────────────────────┐│
│  │ BotStatusCard       ││
│  │ MessageStatsCard    ││
│  │ MessageTrendChart   ││
│  │ LogTable            ││
│  └─────────────────────┘│
└─────────────────────────┘
```

### 📦 TypeScript 타입 정의 (중앙화)

```typescript
// types/dashboard.ts

// 봇 상태
export interface BotStatus {
  isOnline: boolean;
  uptime: number;
  lastSyncAt: string;
  memoryUsage: { usedMB: number; totalMB: number };
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

// 메시지 통계
export interface MessageStats {
  totalMessages: number;
  totalCommands: number;
  totalEvents: number;
  topChannel?: { name: string; count: number };
  peakHour?: { hour: number; count: number };
}

// 차트 데이터
export interface ChartDataPoint {
  date: string;
  dayOfWeek: string;
  messages: number;
  commands: number;
  events: number;
}

// 로그 엔트리
export interface LogEntry {
  id: string;
  type: 'message' | 'command' | 'event' | 'error';
  channel: string;
  message: string;
  userId: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

// API 응답 (제네릭)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  error?: string;
}
```

### 🛠️ 백엔드 API 구현 예제

```typescript
// backend/routes/dashboard.ts
import express from 'express';
import { BotStatusResponse, MessageStatsResponse } from '../types/dashboard';

const router = express.Router();

/**
 * GET /api/dashboard/bot-status
 * 봇 상태 조회
 * 출처: Express.js 라우팅 패턴
 */
router.get('/bot-status', async (req, res) => {
  try {
    const botStatus = await getBotStatus();
    res.json({
      success: true,
      data: botStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bot status',
    });
  }
});

/**
 * GET /api/dashboard/message-stats
 * 메시지 통계 조회
 */
router.get('/message-stats', async (req, res) => {
  const period = req.query.period || 'today';
  try {
    const stats = await getMessageStats(period as string);
    res.json({ success: true, data: stats, period });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/message-trend
 * 메시지 추이 조회
 */
router.get('/message-trend', async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  try {
    const trend = await getMessageTrend(days);
    res.json({ success: true, data: trend.data, summary: trend.summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trend' });
  }
});

/**
 * GET /api/dashboard/logs
 * 로그 조회 (페이지네이션)
 */
router.get('/logs', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type || 'all';

  try {
    const result = await getLogs(page, limit, type as string);
    res.json({ success: true, data: result.logs, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

export default router;
```

### 🔌 WebSocket 구현 (Socket.io)

```typescript
// backend/websocket.ts
import { Server as SocketIOServer } from 'socket.io';

export function setupWebSocket(io: SocketIOServer) {
  io.on('connection', (socket) => {
    // 봇 상태 변경 이벤트
    on('bot-status-change', (newStatus: BotStatus) => {
      io.emit('bot-status-changed', newStatus);
    });

    // 새 로그 추가
    on('log-created', (logEntry: LogEntry) => {
      io.emit('log-added', logEntry);
    });

    // 로그 상태 업데이트
    on('log-status-updated', (logEntry: LogEntry) => {
      io.emit('log-updated', logEntry);
    });

    socket.on('disconnect', () => {
      console.log('Dashboard client disconnected');
    });
  });
}
```

### 🎨 Shadcn/UI 컴포넌트 필수 설치

```bash
# Card, Badge, Button, Input, DropdownMenu, Tooltip, Table
npx shadcn-ui@latest add card badge button input dropdown-menu tooltip table
```

### 📊 Recharts & TanStack Table 설치

```bash
npm install recharts @tanstack/react-table
```

---

## 6️⃣ 구현 로드맵

### Phase 1️⃣ (1주): 기본 구조
- [ ] TypeScript 타입 정의 (`types/dashboard.ts`)
- [ ] Shadcn/UI Card 컴포넌트 설정
- [ ] REST API 엔드포인트 구현 (정적 데이터)
- [ ] BotStatusCard, MessageStatsCard 렌더링

### Phase 2️⃣ (1주): 차트 & 테이블
- [ ] Recharts BarChart 통합
- [ ] TanStack Table 로그 테이블 구현
- [ ] WebSocket 이벤트 리스너 설정
- [ ] 실시간 데이터 스트림 연결

### Phase 3️⃣ (1주): 고급 기능
- [ ] 필터링 (타입, 채널별)
- [ ] 날짜 범위 선택
- [ ] 로그 내보내기 (CSV)
- [ ] 다크모드 / 라이트모드

### Phase 4️⃣ (1주): QA & 배포
- [ ] E2E 테스트 (Cypress)
- [ ] 성능 최적화 (React.memo, 가상 스크롤)
- [ ] 접근성 검증 (WCAG 2.1 AA)
- [ ] 프로덕션 배포

---

## 📚 참고 자료

| 항목 | 링크 | 신뢰도 |
|------|------|--------|
| **Shadcn/UI Card** | https://ui.shadcn.com/docs/components/base/card | ✅ 공식 |
| **Shadcn/UI Table** | https://ui.shadcn.com/docs/components/base/table | ✅ 공식 |
| **TanStack Table** | https://tanstack.com/table | ✅ 공식 |
| **Recharts BarChart** | https://recharts.org/api/BarChart | ✅ 공식 |
| **Socket.io 문서** | https://socket.io/docs/ | ✅ 공식 |
| **Express.js 라우팅** | https://expressjs.com/en/guide/routing.html | ✅ 공식 |

---

**작성일**: 2026-04-11  
**검증 상태**: ✅ 공식 문서 기반 재작성 완료  
**다음 단계**: Source Grounding.md 작성
