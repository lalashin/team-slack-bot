# Plan: Team Slack Bot — 전체 프로젝트 플랜

**작성일**: 2026-04-11  
**상태**: Active  
**레벨**: Dynamic (Fullstack Web Application)  

---

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Problem** | 팀의 Slack 봇이 메시지, 명령어, 이벤트를 처리하지만, 봇의 상태(온라인/오프라인), 일일 통계, 실시간 로그를 한눈에 모니터링할 수 있는 대시보드가 없음. |
| **Solution** | Next.js + Shadcn/UI + TanStack Table + Recharts를 활용한 실시간 모니터링 대시보드를 구축하고, REST API + WebSocket을 통해 실시간 데이터를 수신. |
| **Function UX Effect** | 관리자/팀 리더가 한 화면에서 봇 상태, 일일 통계, 7일 추이 차트, 실시간 로그를 확인하여 봇 운영 효율성 극대화. |
| **Core Value** | 봇 모니터링 자동화, 실시간 성능 추적, 운영 투명성 강화, 문제 조기 발견 및 대응. |

---

## 1. Feature Overview

### 1.1 프로젝트 목표
Team Slack Bot의 **실시간 모니터링 대시보드**를 구축하여 봇의 상태, 통계, 로그를 시각화하고, 팀 운영의 투명성과 효율성을 높입니다.

### 1.2 주요 기능
1. **Bot Status Card** — 봇의 온/오프라인 상태, 가동시간, 메모리 사용량, 연결 상태 실시간 모니터링
2. **Message Stats Card** — 일일 메시지/명령어/이벤트 통계 (3개 카드 레이아웃)
3. **Message Trend Chart** — 7일 메시지 유입 추이를 Recharts BarChart로 시각화
4. **Log Table** — TanStack Table로 실시간 로그 테이블 (필터링, 정렬, 페이지네이션)
5. **실시간 업데이트** — WebSocket (Socket.io)을 통한 실시간 데이터 스트림

### 1.3 대상 사용자
- **팀 리더/매니저** — 봇 운영 상태 모니터링
- **봇 관리자** — 실시간 로그 분석, 문제 해결
- **개발팀** — 봇 성능 추적, 디버깅

### 1.4 비즈니스 목표
- 봇 모니터링 자동화 및 운영 효율성 증대
- 실시간 성능 메트릭 추적
- 문제 조기 발견 및 빠른 대응
- 팀 커뮤니케이션 투명성 강화

---

## 2. Feature Scope

### 2.1 In Scope (포함되는 범위)

#### 2.1.1 프론트엔드 (Next.js + Shadcn/UI)
- BotStatusCard: 봇 상태 실시간 모니터링 (상태, 가동시간, 메모리, 연결 상태)
- MessageStatsCard: 일일 통계 (메시지, 명령어, 이벤트 합계)
- MessageTrendChart: Recharts BarChart로 7일 추이 시각화
- LogTable: TanStack Table 기반 로그 테이블
  - 컬럼: Type (badge), Channel (code), Message, Timestamp, Status, Actions
  - 기능: 검색 필터링, 타입별 필터, 정렬, 페이지네이션 (10행/페이지)

#### 2.1.2 백엔드 (Express.js + REST API)
- `GET /api/dashboard/bot-status` — 봇 상태 조회
- `GET /api/dashboard/message-stats?period=today` — 일일 통계 조회
- `GET /api/dashboard/message-trend?days=7` — 7일 추이 데이터
- `GET /api/dashboard/logs?page=1&limit=10&type=all&channel=all` — 페이지네이션 로그 조회

#### 2.1.3 실시간 통신 (WebSocket)
- Socket.io 기반 WebSocket 구현
- 이벤트:
  - `bot-status-changed` — 봇 상태 변경 시 클라이언트 업데이트
  - `log-added` — 새 로그 생성 시 테이블 상단 추가
  - `log-updated` — 기존 로그 상태 변경 시 업데이트

#### 2.1.4 기술 스택
**프론트엔드**:
- Next.js (React 18+)
- TypeScript
- Shadcn/UI (Card, Badge, Button, Input, DropdownMenu, Table)
- TanStack Table v8
- Recharts (BarChart, ResponsiveContainer)

**백엔드**:
- Node.js 18+
- Express.js
- Socket.io (WebSocket)
- SQLite (기존 데이터베이스)

**개발 도구**:
- TypeScript
- ESLint
- Jest (테스트)
- Cypress (E2E 테스트)

#### 2.1.5 데이터 모델
- `BotStatus` — 봇 상태 인터페이스
- `MessageStats` — 일일 통계 인터페이스
- `ChartDataPoint` — 차트 데이터 포인트
- `LogEntry` — 로그 엔트리

### 2.2 Out of Scope (제외되는 범위)
- 실시간 알람/경고 시스템 (Phase 2+)
- 로그 내보내기 (CSV/JSON) - Phase 3에서 구현
- 대시보드 커스터마이징 (위젯 추가/제거) - Phase 2+
- 다크모드 - Phase 3에서 구현
- 성능 최적화 (가상 스크롤링) - Phase 4에서 구현
- 접근성 (WCAG) 검증 - Phase 4에서 구현

### 2.3 Phase-wise Breakdown

#### Phase 1️⃣ (1주): 기본 구조 & TypeScript 타입
- [ ] TypeScript 타입 정의 (`src/types/dashboard.ts`)
- [ ] Shadcn/UI 설치 및 기본 Card 컴포넌트 설정
- [ ] REST API 엔드포인트 구현 (정적 목업 데이터)
- [ ] BotStatusCard 컴포넌트 구현
- [ ] MessageStatsCard 컴포넌트 구현
- [ ] 기본 레이아웃 구성

#### Phase 2️⃣ (1주): 차트 & 테이블 & 실시간
- [ ] Recharts 통합, MessageTrendChart 구현
- [ ] TanStack Table 통합, LogTable 구현
- [ ] Socket.io 웹소켓 서버 설정
- [ ] 실시간 이벤트 리스너 (bot-status-changed, log-added, log-updated)
- [ ] 클라이언트 WebSocket 연결 로직

#### Phase 3️⃣ (1주): 고급 기능
- [ ] 필터링 (타입별, 채널별, 날짜 범위)
- [ ] 로그 내보내기 (CSV)
- [ ] 다크모드 / 라이트모드 토글
- [ ] 성능 메트릭 추가 (응답시간, 평균 레이턴시)

#### Phase 4️⃣ (1주): QA & 배포
- [ ] Unit 테스트 (각 컴포넌트)
- [ ] Integration 테스트 (API + DB)
- [ ] E2E 테스트 (Cypress)
- [ ] 성능 최적화 (React.memo, 가상 스크롤링)
- [ ] 접근성 검증 (WCAG 2.1 AA)
- [ ] 프로덕션 배포

---

## 3. Requirements

### 3.1 Functional Requirements (기능 요구사항)

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-201 | BotStatusCard: 온/오프라인 상태 표시 | 높음 | 1 |
| FR-202 | BotStatusCard: 가동시간 표시 | 높음 | 1 |
| FR-203 | BotStatusCard: 메모리 사용량 표시 (Progress Bar) | 높음 | 1 |
| FR-204 | BotStatusCard: 연결 상태 표시 | 중간 | 1 |
| FR-205 | MessageStatsCard: 일일 메시지/명령어/이벤트 통계 표시 | 높음 | 1 |
| FR-206 | MessageTrendChart: 7일 BarChart 시각화 | 높음 | 2 |
| FR-207 | LogTable: 타입 필터링 (메시지, 명령어, 이벤트, 에러) | 높음 | 2 |
| FR-208 | LogTable: 검색 필터링 | 중간 | 2 |
| FR-209 | LogTable: 페이지네이션 (10행/페이지) | 높음 | 2 |
| FR-210 | LogTable: 정렬 기능 (컬럼 클릭) | 중간 | 2 |
| FR-211 | WebSocket: 실시간 봇 상태 업데이트 | 높음 | 2 |
| FR-212 | WebSocket: 실시간 로그 추가/업데이트 | 높음 | 2 |
| FR-213 | REST API: `/api/dashboard/bot-status` 엔드포인트 | 높음 | 1 |
| FR-214 | REST API: `/api/dashboard/message-stats` 엔드포인트 | 높음 | 1 |
| FR-215 | REST API: `/api/dashboard/message-trend` 엔드포인트 | 높음 | 2 |
| FR-216 | REST API: `/api/dashboard/logs` 엔드포인트 | 높음 | 2 |
| FR-217 | TypeScript: 모든 타입 정의 | 높음 | 1 |
| FR-218 | 기존 봇 기능 유지: `/todo`, `/list`, `/status`, `/help` | 높음 | All |

### 3.2 Non-Functional Requirements (비기능 요구사항)

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| NFR-201 | API 응답 시간 < 100ms | 중간 | 2 |
| NFR-202 | WebSocket 메시지 지연 < 50ms | 중간 | 2 |
| NFR-203 | 로그 테이블 로드 시간 < 500ms | 중간 | 2 |
| NFR-204 | 메모리 누수 방지 (WebSocket cleanup) | 높음 | 2 |
| NFR-205 | 브라우저 호환성 (Chrome, Safari, Firefox 최신 버전) | 중간 | 3 |
| NFR-206 | 모바일 반응형 디자인 | 중간 | 3 |
| NFR-207 | 접근성 (WCAG 2.1 AA) | 낮음 | 4 |
| NFR-208 | 테스트 커버리지 >= 80% | 중간 | 4 |

---

## 4. Technical Stack Details

### 4.1 프론트엔드 스택

#### 4.1.1 라이브러리 (신규 추가)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@radix-ui/react-slot": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwindcss": "^3.3.0",
    "@shadcn/ui": "latest",
    "recharts": "^2.10.0",
    "@tanstack/react-table": "^8.10.0",
    "socket.io-client": "^4.7.0"
  }
}
```

#### 4.1.2 Shadcn/UI 컴포넌트
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add progress
```

#### 4.1.3 프로젝트 구조
```
src/
├── components/
│   ├── dashboard/
│   │   ├── BotStatusCard.tsx
│   │   ├── MessageStatsCard.tsx
│   │   ├── MessageTrendChart.tsx
│   │   └── LogTable.tsx
│   ├── ui/
│   │   ├── card.tsx (Shadcn)
│   │   ├── badge.tsx (Shadcn)
│   │   └── ...
│   └── layout.tsx
├── pages/
│   ├── api/
│   │   └── dashboard/
│   │       ├── bot-status.ts
│   │       ├── message-stats.ts
│   │       ├── message-trend.ts
│   │       └── logs.ts
│   ├── dashboard.tsx (메인 대시보드 페이지)
│   └── index.tsx
├── types/
│   └── dashboard.ts (BotStatus, MessageStats, ChartDataPoint, LogEntry)
├── utils/
│   ├── api-client.ts (REST API 호출)
│   └── websocket.ts (Socket.io 클라이언트 관리)
└── hooks/
    ├── useBotStatus.ts
    ├── useMessageStats.ts
    ├── useMessageTrend.ts
    └── useLogs.ts
```

### 4.2 백엔드 스택

#### 4.2.1 기존 스택 유지
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite
- **Slack SDK**: @slack/bolt
- **Logging**: Pino

#### 4.2.2 신규 추가
```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "cors": "^2.8.5"
  }
}
```

#### 4.2.3 백엔드 프로젝트 구조
```
src/
├── routes/
│   └── dashboard.ts (REST API 라우터)
├── services/
│   ├── botStatusService.ts
│   ├── messageStatsService.ts
│   ├── messageTrendService.ts
│   └── logService.ts
├── websocket/
│   └── dashboard.ts (Socket.io 이벤트 핸들러)
├── types/
│   └── dashboard.ts (공유 타입)
└── index.ts (Socket.io 서버 초기화)
```

### 4.3 개발 도구
- **TypeScript** — 타입 안정성
- **ESLint** — 코드 품질
- **Jest** — 단위 테스트
- **Cypress** — E2E 테스트
- **Tailwind CSS** — 스타일링

---

## 5. Data Models & API Contract

### 5.1 TypeScript 인터페이스

```typescript
// types/dashboard.ts

// 봇 상태
export interface BotStatus {
  isOnline: boolean;
  uptime: number;                    // 초 단위
  lastSyncAt: string;                // ISO8601
  memoryUsage: {
    usedMB: number;
    totalMB: number;
  };
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
  date: string;                      // YYYY-MM-DD
  dayOfWeek: string;                 // Mon, Tue, ...
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
  timestamp: string;                 // ISO8601
  status: 'success' | 'pending' | 'failed';
}

// API 응답 제네릭
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  error?: string;
}
```

### 5.2 REST API 엔드포인트

```bash
# 봇 상태 조회
GET /api/dashboard/bot-status
Response: ApiResponse<BotStatus>

# 메시지 통계 조회
GET /api/dashboard/message-stats?period=today|week|month
Response: ApiResponse<MessageStats>

# 메시지 추이 조회
GET /api/dashboard/message-trend?days=7
Response: {
  success: boolean,
  data: ChartDataPoint[],
  summary: { averagePerDay, totalWeek, trend, trendPercent }
}

# 로그 조회
GET /api/dashboard/logs?page=1&limit=10&type=all&channel=all
Response: {
  success: boolean,
  data: LogEntry[],
  pagination: { page, limit, total }
}
```

### 5.3 WebSocket 이벤트

```typescript
// 서버 → 클라이언트
socket.on('bot-status-changed', (status: BotStatus) => {});
socket.on('log-added', (logEntry: LogEntry) => {});
socket.on('log-updated', (logEntry: LogEntry) => {});

// 클라이언트 → 서버 (선택적)
socket.emit('request-logs', { type: 'all', limit: 10 });
```

---

## 6. Implementation Strategy

### 6.1 Phase 별 세부 작업

#### **Phase 1: 기본 구조 (1주)**
```
Week 1: Foundations
├─ TypeScript 타입 정의 (1일)
├─ Next.js + Shadcn/UI 기본 설정 (1일)
├─ API 목업 데이터 작성 (0.5일)
├─ BotStatusCard 컴포넌트 (1일)
├─ MessageStatsCard 컴포넌트 (1일)
└─ 기본 레이아웃 & 라우팅 (0.5일)
```

#### **Phase 2: 차트/테이블/실시간 (1주)**
```
Week 2: Chart, Table, WebSocket
├─ Recharts MessageTrendChart 통합 (1.5일)
├─ TanStack Table LogTable 구현 (1.5일)
├─ Socket.io 웹소켓 서버 설정 (1일)
├─ 실시간 이벤트 핸들러 (1일)
├─ WebSocket 클라이언트 로직 (1일)
└─ 통합 테스트 (0.5일)
```

#### **Phase 3: 고급 기능 (1주)**
```
Week 3: Advanced Features
├─ 필터링 UI 개선 (1일)
├─ 로그 내보내기 기능 (1일)
├─ 다크모드 토글 (0.5일)
├─ 성능 메트릭 추가 (1일)
├─ 모바일 반응형 설계 (1.5일)
└─ QA 및 버그 수정 (1일)
```

#### **Phase 4: QA & 배포 (1주)**
```
Week 4: Testing & Deployment
├─ Unit 테스트 (Jest) (1.5일)
├─ Integration 테스트 (1.5일)
├─ E2E 테스트 (Cypress) (1.5일)
├─ 성능 최적화 (1일)
├─ 접근성 검증 (WCAG) (0.5일)
└─ 프로덕션 배포 & 모니터링 (1일)
```

### 6.2 위험 요소 및 대응 전략

| 위험 | 영향도 | 대응 전략 |
|------|--------|---------|
| WebSocket 연결 불안정 | 높음 | 자동 재연결 로직, 폴백 REST API |
| 대량 로그 데이터 성능 저하 | 중간 | 페이지네이션, 가상 스크롤링 (Phase 4) |
| Shadcn/UI 버전 호환성 | 낮음 | 최신 버전 고정, 정기 업데이트 |
| TypeScript 타입 복잡성 | 낮음 | 문서화, 코드 리뷰 |
| 기존 봇 기능 충돌 | 중간 | 독립적 대시보드 라우팅, 통합 테스트 |

---

## 7. Success Criteria

### 7.1 기능 완성도
- [ ] 모든 4개 카드/차트 컴포넌트 구현 완료
- [ ] REST API 4개 엔드포인트 정상 작동
- [ ] WebSocket 실시간 업데이트 < 100ms 지연
- [ ] 기존 봇 기능 100% 유지

### 7.2 품질 지표
- [ ] 테스트 커버리지 >= 80%
- [ ] E2E 테스트 전체 통과
- [ ] 로그 테이블 10,000행 로드 < 1초
- [ ] Lighthouse 성능 점수 >= 90

### 7.3 사용자 만족도
- [ ] 대시보드 응답시간 < 500ms
- [ ] 모바일 접근성 확인
- [ ] 팀 피드백 수렴 (> 4/5 만족도)

---

## 8. 참고 자료

| 항목 | 링크 | 신뢰도 |
|------|------|--------|
| Shadcn/UI Card | https://ui.shadcn.com/docs/components/base/card | ✅ 공식 |
| Shadcn/UI Table | https://ui.shadcn.com/docs/components/base/table | ✅ 공식 |
| TanStack Table | https://tanstack.com/table | ✅ 공식 |
| Recharts BarChart | https://recharts.org/api/BarChart | ✅ 공식 |
| Socket.io 문서 | https://socket.io/docs/ | ✅ 공식 |
| Express.js 라우팅 | https://expressjs.com/en/guide/routing.html | ✅ 공식 |
| Next.js 가이드 | https://nextjs.org/docs | ✅ 공식 |

---

## 9. PDCA Phase Status

- **Plan**: ✅ 현재 작성 중
- **Design**: ⏳ 대기 (Plan 완료 후)
- **Do**: ⏳ 대기 (Design 완료 후)
- **Check**: ⏳ 대기 (Implementation 완료 후)
- **Act**: ⏳ 대기 (Gap analysis 결과 반영)
- **Report**: ⏳ 대기 (완료 후)

---

**최종 작성일**: 2026-04-11  
**작성자**: Claude Code  
**검증 상태**: dashboard_spec.md 기반 완성
