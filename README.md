# Team Slack Bot

팀의 Slack 채널에서 작업을 효율적으로 관리하는 자동화 봇입니다.

## 개요

팀원들이 Slack에서 슬래시 명령어로 업무를 관리하고, 봇이 작업 추적과 **스케줄 알림**(봇 기동 시 안내·매일 Daily Standup)을 수행합니다. 로컬 개발 시 **Socket Mode**(`SLACK_APP_TOKEN`)로 공개 URL 없이 연결할 수 있으며, 로그는 **pino**로 출력됩니다.

## 주요기능

- **`/todo "작업명"`** — 새 작업 추가
- **`/list`** — 작업 목록 조회(상태별 필터 가능)
- **`/status`** — 봇 상태·활성 작업 수
- **`/help`** — 명령어 도움말
- **메시지 반응(Reaction)** — 반응으로 작업 상태 변경
  - ✅ `white_check_mark` — 완료
  - ⏳ `hourglass_flowing_sand` — 진행 중
- **스케줄 알림** (`src/schedulers/daily-standup.js`)
  - 봇 기동 시 지정 채널에 시작 메시지
  - 매일 오전 9시(Asia/Seoul) Daily Standup 안내
- **Graceful shutdown** — `SIGINT` / `SIGTERM` 시 Slack 앱 종료 및 크론 작업 정리

## 기술스택

| 항목 | 기술 |
|------|------|
| **Runtime** | Node.js 18+ |
| **Slack** | @slack/bolt, @slack/socket-mode(선택) |
| **HTTP** | Express.js |
| **Database** | SQLite3 |
| **스케줄** | node-cron |
| **로깅** | pino |
| **Package Manager** | npm |
| **Testing** | Jest |
| **Code Quality** | ESLint |

## 설치방법

### 사전 조건

- **Node.js** 18 이상, **npm** 9 이상
- **Slack 워크스페이스**에서 앱 생성·설치 권한
- 봇용 **Bot Token**, **Signing Secret**

### 단계별 설치

#### 1단계: 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd team-slack-bot
npm install
```

#### 2단계: Slack App 생성

1. [Slack API 앱 목록](https://api.slack.com/apps)에서 앱 생성  
2. **OAuth & Permissions** → **Bot Token Scopes** 예: `chat:write`, `commands`, `app_mentions:read`, `reactions:read` 등 (기능에 맞게 추가 후 **워크스페이스에 재설치**)

#### 3단계: Socket Mode(로컬에서 ngrok 없이 쓸 때)

1. 앱 설정에서 **Socket Mode** 활성화  
2. **App-Level Tokens**에 `connections:write` 로 토큰 발급 → `.env`의 `SLACK_APP_TOKEN`에 입력

#### 4단계: 환경변수

```bash
# macOS / Linux
cp .env.example .env

# Windows (CMD)
copy .env.example .env
```

`.env`에 최소 다음을 채웁니다.

| 변수 | 설명 |
|------|------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Signing Secret |
| `SLACK_NOTIFICATION_CHANNEL` | 알림을 보낼 **채널 ID** (`C...`). 코드에서 필수이며, 없으면 기동 시 오류 |
| `SLACK_APP_TOKEN` | (선택) Socket Mode용 `xapp-...` |

상세한 키 목록은 아래 [환경변수](#환경변수)를 참고하세요.

#### 5단계: 실행

```bash
npm run dev    # nodemon 자동 재시작
npm start      # 프로덕션과 동일하게 node 직접 실행
```

기본 포트는 `3000`입니다(`PORT`로 변경 가능).

## 사용방법

### 슬래시 명령어

```
/todo "작업명"     — 새 작업 추가
/list [상태]      — 목록 조회
/status           — 봇 상태
/help             — 도움말
```

### 알림 기능

- **설정 파일**: `src/schedulers/daily-standup.js`  
- **채널 지정**: `.env`의 **`SLACK_NOTIFICATION_CHANNEL`** (채널 ID는 Slack에서 채널 정보로 확인)  
- **동작**
  - 봇 시작 직후: `✅ 슬랙봇이 시작되었습니다!`
  - 매일 09:00 (KST): Daily Standup 안내 메시지  
- **주의**: 해당 채널에 **봇을 초대**하고 `chat:write` 등 권한이 있어야 합니다.  
- **테스트**: 봇을 재실행해 시작 메시지 수신 여부 확인. 9시 알림은 당일 스케줄을 기다리거나, 개발 중에만 `daily-standup.js`의 cron 식을 잠시 “몇 분 뒤”로 바꿔 검증 후 **원복**하세요.

### 반응으로 상태 변경

- **✅** `white_check_mark` → 완료  
- **⏳** `hourglass_flowing_sand` → 진행 중  

## 프로젝트 구조

```
team-slack-bot/
├── src/
│   ├── index.js                 # 프로세스 진입점, 앱 기동·스케줄러·시그널 처리
│   ├── app.js                   # Bolt App 생성, 핸들러 등록
│   ├── logger.js                # pino 로거
│   ├── config/
│   │   └── slack.js             # 환경변수 기반 설정
│   ├── handlers/
│   │   ├── index.js
│   │   ├── commands.js
│   │   └── events.js
│   ├── messages/
│   │   └── help.js
│   ├── services/
│   │   └── dataService.js
│   ├── utils/
│   │   └── validators.js
│   ├── schedulers/
│   │   └── daily-standup.js     # 시작 알림 + Daily Standup 크론
│   └── db/
│       ├── init.js
│       ├── sql.js
│       └── tasksRepo.js
├── tests/
├── docs/                        # PDCA·기능 문서
├── data/                        # SQLite DB 파일 위치(기본)
├── .env.example
├── .env                         # 로컬 전용(git 무시)
├── package.json
├── CLAUDE.md
└── README.md
```

## 환경변수

### 필수

| 변수 | 설명 | 예시 |
|------|------|------|
| `SLACK_BOT_TOKEN` | Bot OAuth 토큰 | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | 요청 서명 검증용 | |
| `SLACK_NOTIFICATION_CHANNEL` | 알림용 채널 ID | `C01234567` |

### 선택

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `SLACK_APP_TOKEN` | Socket Mode용 App-Level 토큰 (`xapp-...`). 있으면 Socket Mode 사용 | (없음) |
| `PORT` | HTTP 리스너 포트(Bolt) | `3000` |
| `NODE_ENV` | 실행 환경 | `development` |
| `DB_PATH` | SQLite 경로 | `./data/slack-bot.db` |
| `LOG_LEVEL` | 로그 레벨(pino) | 설정에 따름 |

배포 시(Heroku 등)에도 위 변수를 동일하게 설정하세요. 알림을 쓰려면 **`SLACK_NOTIFICATION_CHANNEL`**을 반드시 넣어야 합니다.

## 테스트

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 코드 품질

```bash
npm run lint
npm run lint:fix
```

(저장소에 ESLint 설정 파일이 있을 때 동작합니다.)

## 배포

### Heroku 예시

```bash
heroku login
heroku create team-slack-bot
heroku config:set SLACK_BOT_TOKEN=xoxb-...
heroku config:set SLACK_SIGNING_SECRET=...
heroku config:set SLACK_NOTIFICATION_CHANNEL=C...
# Socket Mode를 쓰는 경우
# heroku config:set SLACK_APP_TOKEN=xapp-...
git push heroku main
heroku logs --tail
```

## 트러블슈팅

### `SLACK_NOTIFICATION_CHANNEL must be set`

`.env`에 `SLACK_NOTIFICATION_CHANNEL`이 없거나 비어 있습니다. 채널 ID를 넣고 다시 실행하세요.

### 알림이 오지 않음

- 채널 ID가 맞는지, 그 채널에 봇이 **멤버**인지 확인  
- Slack API 오류는 로그(pino)에 출력됩니다.

### 토큰 오류

`token_revoked` 등 → Slack 앱에서 토큰 재발급 후 `.env` 갱신

### 포트 충돌

`Error: listen EADDRINUSE`

```bash
set PORT=3001 && npm run dev
```

(PowerShell: `$env:PORT=3001; npm run dev`)

### DB 잠금

`database is locked` → 다른 프로세스가 DB를 사용 중일 수 있음. 중복 실행 여부 확인 후 재시작

## 개발 가이드

- **[CLAUDE.md](./CLAUDE.md)** — 개발 규칙  
- **[docs/](./docs/)** — 기획·설계·분석 문서  
- 알림 기능: `docs/01-plan/features/notification-feature.plan.md`, `docs/02-design/features/notification-feature.design.md`

## 라이센스

MIT

## 기여

이슈로 버그·기능 요청을 남겨 주세요.

---

**마지막 업데이트**: 2026-04-10  
**비고**: 알림은 `SLACK_NOTIFICATION_CHANNEL` + `src/schedulers/daily-standup.js` 기준으로 동작합니다.
