# Team Slack Bot

팀의 Slack 채널에서 작업을 효율적으로 관리하는 자동화 봇과, **모니터링 대시보드(Next.js)** 를 포함한 저장소입니다.

## 개요

- **Slack 봇**: 슬래시 명령으로 할 일을 관리하고, **스케줄 알림**(기동 시 안내·Daily Standup), **반응으로 상태 변경** 등을 지원합니다. 로컬에서는 **Socket Mode**(`SLACK_APP_TOKEN`)로 공개 URL 없이 연결할 수 있으며, 로그는 **pino**로 출력됩니다.
- **대시보드 (`dashboard/`)**: 봇 상태·통계·차트·로그 UI를 제공합니다. 현재 기본 화면은 **목업 데이터**이며, 실데이터는 REST API 연동 후 채워집니다. 상세한 남은 작업은 `cursor-dev-note/remaining-work-dashboard-and-bot.md`를 참고하세요.

## 주요 기능 (봇)

- **`/todo "작업명"`** — 새 작업 추가
- **`/list`** — 작업 목록 조회(상태별 필터 가능)
- **`/status`** — 봇 상태·활성 작업 수
- **`/help`** — 명령어 도움말
- **멘션·DM** — 도움말·안내
- **메시지 반응(Reaction)** — 반응으로 작업 상태 변경  
  - ✅ `white_check_mark` — 완료  
  - ⏳ `hourglass_flowing_sand` — 진행 중
- **스케줄 알림** (`src/schedulers/daily-standup.js`)  
  - 봇 기동 시 지정 채널에 시작 메시지  
  - 매일 오전 9시(Asia/Seoul) Daily Standup 안내
- **Graceful shutdown** — `SIGINT` / `SIGTERM` 시 Slack 앱 종료 및 크론 작업 정리
- **HTTP 모드** 선택 시 요청 본문 크기 상한 미들웨어 (`src/middleware/httpPayloadLimit.js`)

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Runtime** | Node.js 18+ |
| **Slack** | @slack/bolt, @slack/socket-mode |
| **HTTP** | Express.js |
| **Database** | SQLite3 |
| **스케줄** | node-cron |
| **로깅** | pino |
| **테스트** | Jest |
| **품질** | ESLint |
| **대시보드** | Next.js 14, TypeScript, Tailwind CSS, Recharts, TanStack Table (`dashboard/`) |

## 설치 (Slack 봇)

### 사전 조건

- **Node.js** 18 이상, **npm** 9 이상
- Slack 워크스페이스에서 앱 생성·설치 권한
- 봇용 **Bot Token**, **Signing Secret**

### 1. 클론 및 의존성

```bash
git clone <repository-url>
cd team-slack-bot
npm install
```

### 2. Slack App

1. [Slack API 앱 목록](https://api.slack.com/apps)에서 앱 생성  
2. **OAuth & Permissions** → **Bot Token Scopes** (`chat:write`, `commands`, `app_mentions:read`, `reactions:read` 등) 후 **워크스페이스에 재설치**

### 3. Socket Mode (로컬에서 ngrok 없이)

1. 앱 설정에서 **Socket Mode** 활성화  
2. **App-Level Tokens**에 `connections:write` 로 토큰 발급 → `.env`의 `SLACK_APP_TOKEN`

### 4. 환경 변수

```bash
cp .env.example .env
# Windows: copy .env.example .env
```

| 변수 | 설명 |
|------|------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Signing Secret |
| `SLACK_NOTIFICATION_CHANNEL` | 알림 채널 ID (`C...`). **필수** — 없으면 기동 시 오류 |
| `SLACK_APP_TOKEN` | (선택) Socket Mode용 `xapp-...` |

### 5. 실행

```bash
npm run dev    # nodemon
npm start      # node 직접 실행
```

기본 HTTP 포트는 `3000`입니다(`PORT`로 변경 가능).

## 대시보드 (`dashboard/`)

봇과 **별도 앱**입니다. 의존성 설치 후 로컬에서 확인할 수 있습니다.

```bash
cd dashboard
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` (다른 터미널에서 봇도 켜 두었다면, 대시보드 포트가 겹치면 `npm run dev -- -p 3001` 등으로 조정).

### 프로덕션 미리보기 (Vercel)

이 레포를 Vercel에 연결해 배포한 경우, 아래처럼 접속할 수 있습니다. **도메인은 프로젝트·재배포마다 달라질 수 있으므로**, 최종 주소는 [Vercel Dashboard](https://vercel.com/dashboard) → 해당 Project → **Domains / Production** 에서 확인하는 것이 정확합니다.

- **예시 (본 레포 배포 시):** [https://dashboard-nu-sepia-94.vercel.app](https://dashboard-nu-sepia-94.vercel.app)

- **환경 변수 예시**: `dashboard/.env.example` (`NEXT_PUBLIC_API_BASE_URL` — 실 API 연동 시)
- **스펙·타입**: 루트 `dashboard_spec.md`, `dashboard/types/dashboard.ts`
- **배포(Vercel)**: `cursor-dev-note/deploy-dashboard-vercel.md` — Git 연동 시 저장소에서 **Root Directory를 `dashboard`** 로 지정

## 사용 방법 (봇)

### 슬래시 명령

```
/todo "작업명"     — 새 작업 추가
/list [상태]      — 목록 조회
/status           — 봇 상태
/help             — 도움말
```

### 알림

- 설정: `src/schedulers/daily-standup.js`  
- 채널: `.env`의 **`SLACK_NOTIFICATION_CHANNEL`**  
- 해당 채널에 봇을 초대하고 `chat:write` 권한이 있어야 합니다.

### 반응으로 상태 변경

- ✅ `white_check_mark` → 완료  
- ⏳ `hourglass_flowing_sand` → 진행 중  

## 프로젝트 구조

```
team-slack-bot/
├── src/                         # Slack 봇 (Node)
│   ├── index.js
│   ├── app.js                   # Bolt App (Socket / HTTP)
│   ├── logger.js
│   ├── config/slack.js
│   ├── constants/
│   ├── middleware/              # 예: HTTP 페이로드 제한
│   ├── handlers/
│   ├── messages/
│   ├── services/dataService.js
│   ├── utils/validators.js
│   ├── schedulers/daily-standup.js
│   └── db/                      # SQLite 초기화·tasksRepo
├── tests/
├── dashboard/                   # 모니터링 UI (Next.js)
│   ├── app/
│   ├── components/
│   ├── types/dashboard.ts
│   └── package.json
├── docs/                        # 기획·분석 등
│   ├── 01-plan/features/
│   └── 03-analysis/
├── cursor-dev-note/             # 개발 메모·배포 가이드·남은 작업
├── dashboard_spec.md            # 대시보드 API·UI 스펙
├── data/                        # SQLite DB (기본, git 무시)
├── .env.example
├── .env                         # 로컬 전용 (git 무시)
├── package.json
├── CLAUDE.md
└── README.md
```

## 환경 변수 (봇)

### 필수

| 변수 | 설명 | 예시 |
|------|------|------|
| `SLACK_BOT_TOKEN` | Bot OAuth 토큰 | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | 요청 서명 검증 | |
| `SLACK_NOTIFICATION_CHANNEL` | 알림 채널 ID | `C01234567` |

### 선택

| 변수 | 설명 | 기본 |
|------|------|------|
| `SLACK_APP_TOKEN` | Socket Mode (`xapp-...`) | (없음) |
| `PORT` | HTTP 포트 | `3000` |
| `NODE_ENV` | 실행 환경 | `development` |
| `DB_PATH` | SQLite 경로 | `./data/slack-bot.db` |
| `LOG_LEVEL` | pino 로그 레벨 | 설정에 따름 |

## 테스트·린트 (봇)

```bash
npm test
npm run test:watch
npm run test:coverage
npm run lint
npm run lint:fix
```

## 배포

### Slack 봇 (예: Heroku)

환경 변수를 호스팅 콘솔에 동일하게 설정합니다. Socket Mode 사용 시 `SLACK_APP_TOKEN`도 설정합니다.

```bash
heroku login
heroku create team-slack-bot
heroku config:set SLACK_BOT_TOKEN=xoxb-...
heroku config:set SLACK_SIGNING_SECRET=...
heroku config:set SLACK_NOTIFICATION_CHANNEL=C...
git push heroku main
heroku logs --tail
```

### 대시보드 (Vercel)

- 저장소 연결 후 **Root Directory: `dashboard`**
- CLI: `cd dashboard && npx vercel`  
- 자세한 절차: **`cursor-dev-note/deploy-dashboard-vercel.md`**

봇과 대시보드를 **한 도메인**에 묶으려면 리버스 프록시나 Next `rewrites`로 `/api`를 봇 서버에 넘기는 방식을 검토합니다(연동은 `remaining-work-dashboard-and-bot.md` 참고).

## Git 브랜치 (참고)

작업 주제별로 나눈 예시 브랜치가 있을 수 있습니다.

- `03-docs-socket-mode` — Socket Mode 대응·문서·README 갱신 등(대시보드 이전 시점)
- `04-nextjs-dashboard` — Next 대시보드·노트·배포 문서 포함(현재 `main`과 동일할 수 있음)

## 문서

- **[CLAUDE.md](./CLAUDE.md)** — 개발 규칙  
- **[docs/](./docs/)** — 기획·분석  
- **알림 기능**: `docs/01-plan/features/notification-feature.plan.md`, `docs/02-design/features/notification-feature.design.md`  
- **대시보드 플랜**: `docs/01-plan/features/team-slack-bot.plan.md`  
- **수강생 마무리 안내**: `cursor-dev-note/student-closing-message.md`

## 트러블슈팅

### `SLACK_NOTIFICATION_CHANNEL must be set`

`.env`에 채널 ID를 넣고 다시 실행하세요.

### 알림이 오지 않음

채널 ID·봇 멤버십·로그(pino)를 확인하세요.

### 토큰 오류

Slack 앱에서 토큰 재발급 후 `.env` 갱신

### 포트 충돌

`Error: listen EADDRINUSE` — `PORT`를 바꿔 실행 (PowerShell: `$env:PORT=3001; npm run dev`)

### DB 잠금

`database is locked` — 동일 DB를 쓰는 프로세스가 중복 실행되지 않았는지 확인

### Next 대시보드 hydration 경고

날짜 표시는 서버·클라이언트가 같은 로캘/타임존을 쓰도록 `dashboard/components/Dashboard.tsx`에서 처리합니다.

## 라이선스

MIT

## 기여

이슈로 버그·기능 요청을 남겨 주세요.

---

**마지막 업데이트**: 2026-04-11
