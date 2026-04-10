# 남은 업무 상세 — Team Slack Bot & Dashboard (2026-04-11 기준)

수강생용 마무리 안내는 **`student-closing-message.md`** 를 참고하세요.

이 문서는 **현재 레포지토리 상태**를 전제로, PRD(`docs/01-plan/features/team-slack-bot.plan.md`)·`dashboard_spec.md`·구현된 `dashboard/` Next 앱과 **갭**을 메우기 위한 **남은 작업**을 꼼꼼히 정리한 것입니다. 우선순위는 **배포된 데모(목업) → 실데이터 API → 실시간** 순이 일반적으로 현실적입니다.

---

## 1. 현재 완료된 것 (기준선)

| 영역 | 상태 |
|------|------|
| Slack 봇 (Bolt, Socket Mode) | `/todo`, `/list`, `/status`, `/help`, 멘션·DM·리액션 등 핸들러 존재 |
| SQLite | `tasks`, `users`, `events_log` 스키마, `dataService.logEvent`로 이벤트 적재 |
| 대시보드 UI (`dashboard/`) | Next.js 14, Shadcn 스타일(다크), Recharts, TanStack Table, 타입 정의 |
| 대시보드 데이터 | **`app/page.tsx` 목업** — 수치·로그는 **가정값** |
| 백엔드 대시보드 API | **미구현** — `GET /api/dashboard/*` 없음 |
| WebSocket | **미구현** — `bot-status-changed`, `log-added` 등 없음 |
| 프로덕션 배포 | **`cursor-dev-note/deploy-dashboard-vercel.md`** 참고 — 대시보드만 Vercel 등에 **목업 UI 배포** 가능 |

---

## 2. Phase A — 백엔드 REST API (Express + 기존 DB)

**목표:** `dashboard_spec.md`에 정의된 JSON을 **실제 SQLite 집계**로 채운다.

### 2.1 공통

- [ ] Express 앱(`src/app.js` 등)에 **`/api/dashboard` 라우터** 마운트 (또는 별도 `routes/dashboard.js`).
- [ ] 응답 본문이 프론트 타입과 일치하는지 확인 (`dashboard/types/dashboard.ts`와 동일 필드명).
- [ ] SQLite 날짜는 `created_at` TEXT(`datetime('now')`) — 집계 시 **`date()` / `strftime`** 로 일·주·월 경계 명시.
- [ ] 에러 시 `{ success: false, error: string }` 등 일관된 형식.

### 2.2 `GET /api/dashboard/bot-status`

| 필드 | 제안 구현 |
|------|-----------|
| `isOnline` | Bolt 앱 시작 후 `true`, 종료 시엔 요청 자체가 없으므로 헬스 체크용으로 `true` 고정 또는 heartbeat 파일 |
| `uptime` | `process.uptime()` (초) |
| `lastSyncAt` | 마지막 이벤트 시각 `events_log` MAX(`created_at`) 또는 `new Date().toISOString()` |
| `memoryUsage` | `process.memoryUsage()` → MB 환산, `totalMB`는 힙 한도 근사 또는 고정 표기(스펙과 합의) |
| `connectionStatus` | Socket Mode 클라이언트 상태를 싱글톤으로 보관해 `connected` 등 반환(구현 난이도 있음 → 1차는 `connected` 고정 가능) |

### 2.3 `GET /api/dashboard/message-stats?period=today|week|month`

- [ ] `events_log`에서 기간 필터 후:
  - **메시지 수:** `event_type IN ('app_mention', …)` 또는 메타데이터 기준(팀 정의).
  - **명령어 수:** `event_type LIKE 'command_%'`.
  - **이벤트 수:** 전체 행 수 또는 `command` 제외한 처리 건수(스펙과 라벨 맞추기).
- [ ] `topChannel`, `peakHour`는 `metadata` JSON 파싱 후 채널·시간대 집계(없으면 생략).

### 2.4 `GET /api/dashboard/message-trend?days=7`

- [ ] 일자별로 `messages` / `commands` / `events` 집계 → `ChartDataPoint[]`.
- [ ] `summary`: 평균, 합계, 전주 대비 증감(간단히 `trend`, `trendPercent`).

### 2.5 `GET /api/dashboard/logs?page=&limit=&type=&channel=`

- [ ] `events_log` 페이지네이션 조회.
- [ ] 각 행을 `mapSlackBotEventRowToLogEntry`와 **동일 규칙**으로 변환해 `LogEntry[]` 반환 (`dashboard/types/dashboard.ts`의 매퍼 재사용·이식).

### 2.6 CORS (프론트가 다른 오리진일 때)

- [ ] `Access-Control-Allow-Origin`에 대시보드 출처만 허용(개발: `http://localhost:3000`).
- [ ] 가능하면 **Next rewrites로 동일 오리진** 프록시해 CORS 제거(아래 Phase B 참고).

---

## 3. Phase B — Next 대시보드 연동

- [ ] `dashboard/app/page.tsx`에서 목업 제거.
- [ ] `NEXT_PUBLIC_API_BASE_URL`(또는 상대 경로)로 위 API 호출 — `fetch` / SWR / TanStack Query 중 택1.
- [ ] 로딩·에러 UI(스켈레톤 또는 메시지).
- [ ] **Hydration 이슈 방지:** 날짜는 서버·클라이언트 동일 포맷 유지(`Dashboard.tsx`의 `Intl.DateTimeFormat` 고정 패턴 유지).

### 3.1 선택: Next `rewrites` (권장)

- `next.config.mjs`에 `rewrites`로 `/api/dashboard/:path*` → 봇 서버 URL로 프록시.
- [ ] 이때 브라우저는 **상대 경로만** 호출해 CORS 불필요.

---

## 4. Phase C — 실시간 (Socket.io, 선택)

- [ ] HTTP 서버에 `socket.io` attach.
- [ ] 이벤트: `bot-status-changed`, `log-added`, `log-updated` (스펙과 동일 이름).
- [ ] 봇에서 `logEvent` 직후 또는 미들웨어에서 `io.emit` 연결.
- [ ] `dashboard` 클라이언트: `socket.io-client` 구독 후 상태 갱신.

**주의:** 방화벽·Sticky 세션·프록시에서 WebSocket 업그레이드 허용 필요.

---

## 5. Phase D — 품질·운영

- [ ] `.env.example`에 `PORT`, `DB_PATH`, 대시보드용 URL 변수 문서화.
- [ ] 프로덕션에서 Slack 토큰·DB 파일 경로·백업 정책 정리.
- [ ] (선택) API 키·Basic Auth로 대시보드 API 보호.

---

## 6. 검증 체크리스트 (실데이터 연동 후)

1. Slack에서 `/todo` 실행 → 로그 테이블·명령어 카운트 증가.
2. `events_log` 행 수와 대시보드 합계가 논리적으로 일치.
3. 새로고침 후에도 동일 데이터(캐시 정책 확인).
4. `npm run build` (루트 봇 / `dashboard/` 각각) 성공.

---

## 7. 참고 파일 경로

| 내용 | 경로 |
|------|------|
| 플랜(PRD 성격) | `docs/01-plan/features/team-slack-bot.plan.md` |
| 대시보드 스펙 | `dashboard_spec.md` (레포 루트) |
| 대시보드 타입·봇 로그 매퍼 | `dashboard/types/dashboard.ts` |
| 대시보드 UI | `dashboard/components/Dashboard.tsx` |
| 봇 이벤트 기록 | `src/services/dataService.js`, `src/db/tasksRepo.js` |

---

## 8. 이번 기수 범위 제안 (강의 일정과 트레이드오프)

- **최소 완성:** Phase A·B 중 **일부 엔드포인트만** + 나머지는 목업 병행.
- **시연용:** 목업 대시보드 **배포 URL** + 봇은 **로컬 시연**으로 역할 분리해도 학습 목표 달성 가능.

이 문서는 진행에 따라 체크박스와 날짜를 갱신해 쓰면 됩니다.
