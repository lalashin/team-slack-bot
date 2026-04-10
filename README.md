# Team Slack Bot

팀의 Slack 채널에서 작업을 효율적으로 관리하는 자동화 봇입니다.

## 개요

팀원들이 Slack에서 직접 명령어를 통해 업무를 관리하고, 봇이 자동으로 작업 추적과 알림을 수행합니다. 이를 통해 팀 협업의 중앙화와 효율성 향상을 목표로 합니다.

## 주요기능

- **`/todo "작업명"`** - 새로운 작업 추가
- **`/list`** - 현재 작업 목록 조회 (상태별 필터링 가능)
- **`/status`** - 봇 상태 확인 및 활성 작업 수 조회
- **`/help`** - 사용 가능한 명령어 도움말 표시
- **메시지 반응(Reaction)** - 반응(reaction)으로 작업 상태 자동 변경
  - ✅ `white_check_mark` - 작업 완료
  - ⏳ `hourglass_flowing_sand` - 진행 중으로 변경
- **스케줄 알림** - 봇 기동 시 지정 채널에 시작 메시지 전송, 매일 오전 9시(한국 시간) Daily Standup 안내

## 기술스택

| 항목 | 기술 |
|------|------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **Slack SDK** | @slack/bolt (공식 SDK) |
| **Database** | SQLite3 |
| **Package Manager** | npm |
| **Testing** | Jest |
| **Code Quality** | ESLint |
| **스케줄** | node-cron |

## 설치방법

### 사전 조건

- **Node.js** 18 이상
- **npm** 9 이상
- **Slack 워크스페이스** 관리자 권한
- **Slack App 토큰** (생성 필요)

### 단계별 설치

#### 1단계: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone <repository-url>
cd team-slack-bot

# 의존성 설치
npm install
```

#### 2단계: Slack App 등록

1. [Slack API 대시보드](https://api.slack.com/apps)에서 새 앱 생성
2. "From scratch" 선택
3. 앱 이름: `Team Slack Bot`
4. 워크스페이스 선택

#### 3단계: 권한 설정

1. **OAuth & Permissions** → **Scopes** 이동
2. **Bot Token Scopes**에 다음 추가:
   - `chat:write` - 메시지 전송
   - `commands` - 슬래시 명령어
   - `app_mentions:read` - 멘션 감지
   - `reactions:read` - 반응 감지

#### 4단계: 환경변수 설정

```bash
# .env.example 복사
cp .env.example .env

# .env 파일에 다음 정보 입력
# SLACK_BOT_TOKEN: Slack App의 "Bot User OAuth Token"
# SLACK_SIGNING_SECRET: Slack App의 "Signing Secret"
```

#### 5단계: 서버 실행

```bash
# 개발 모드 (자동 재로드)
npm run dev

# 프로덕션 모드
npm start
```

서버가 포트 3000에서 시작됩니다. (설정으로 변경 가능)

## 사용방법

### 기본 명령어

Slack에서 아래 명령어를 입력하세요:

```
/todo "작업명"
  새로운 작업을 추가합니다.
  예: /todo "회의 자료 준비"

/list [상태]
  작업 목록을 조회합니다.
  예: /list (모든 작업)
  예: /list done (완료된 작업만)

/status
  봇의 상태를 확인합니다.
  활성 작업 수와 시스템 상태를 표시합니다.

/help
  사용 가능한 모든 명령어의 도움말을 표시합니다.
```

### 알림 기능

스케줄 알림을 쓰려면 `.env`에 `NOTIFICATION_CHANNEL_ID`를 설정하세요. 값은 알림을 받을 **채널 ID**입니다(Slack 데스크톱에서 채널 이름 옆 ··· → 채널 세부정보 등에서 확인).

- **봇 시작 시**: 해당 채널에 “슬랙봇이 시작되었습니다!” 메시지가 전송됩니다.
- **매일 오전 9시(Asia/Seoul)**: 같은 채널에 Daily Standup 안내 메시지가 전송됩니다.

`NOTIFICATION_CHANNEL_ID`가 비어 있으면 스케줄러는 동작하지 않으며, 콘솔에 경고만 출력됩니다. 봇이 해당 채널에 메시지를 보내려면 Slack 앱에 `chat:write` 등 필요한 권한이 있어야 하고, 봇을 그 채널에 초대해 두어야 합니다.

### 반응으로 상태 변경

메시지에 반응을 추가하면 작업 상태가 자동으로 변경됩니다:

- **✅ (white_check_mark)** 반응 추가 → 작업 상태를 "완료"로 변경
- **⏳ (hourglass_flowing_sand)** 반응 추가 → 작업 상태를 "진행 중"으로 변경

## 프로젝트 구조

```
team-slack-bot/
├── src/
│   ├── app.js                    # 메인 애플리케이션 진입점
│   ├── config/
│   │   └── slack.js              # Slack 설정 관리
│   ├── handlers/
│   │   ├── commands.js           # 슬래시 명령어 핸들러
│   │   └── events.js             # Slack 이벤트 핸들러
│   ├── services/
│   │   └── dataService.js        # 데이터 접근 계층
│   ├── utils/
│   │   └── validators.js         # 입력 검증 유틸
│   ├── schedulers/
│   │   └── daily-standup.js      # Daily Standup 등 스케줄 알림
│   └── db/
│       └── init.js               # 데이터베이스 초기화
├── tests/
│   └── app.test.js               # 단위 테스트
├── docs/
│   ├── 01-plan/                  # 기획 문서
│   ├── 02-design/                # 설계 문서
│   ├── 03-analysis/              # 분석 문서
│   └── 04-report/                # 최종 보고서
├── data/                         # SQLite 데이터베이스 파일 위치
├── .env.example                  # 환경변수 예시 (git 추적)
├── .env                          # 실제 환경변수 (git 무시)
├── .gitignore                    # Git 무시 파일 목록
├── .cursorignore                 # Cursor IDE 무시 목록
├── package.json                  # 프로젝트 설정 및 의존성
├── CLAUDE.md                     # Claude Code 개발 가이드
├── BKIT_명령어_가이드.txt        # BKIT 플러그인 사용 가이드
└── README.md                     # 이 파일
```

## 환경변수

### 필수 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `SLACK_BOT_TOKEN` | Slack Bot의 OAuth 토큰 | `xoxb-123456...` |
| `SLACK_SIGNING_SECRET` | Slack 이벤트 서명 시크릿 | `abc123def...` |

### 선택 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |
| `NODE_ENV` | 실행 환경 | `development` |
| `DB_PATH` | SQLite 데이터베이스 경로 | `./data/slack-bot.db` |
| `NOTIFICATION_CHANNEL_ID` | 스케줄 알림(시작 안내·Daily Standup)을 보낼 Slack 채널 ID. 미설정 시 알림 비활성화 | (없음) |

## 테스트

```bash
# 전체 테스트 실행
npm test

# Watch 모드로 테스트
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

## 코드 품질

```bash
# 코드 린트 검사
npm run lint

# 자동 수정
npm run lint:fix
```

## 배포

### Heroku 배포

```bash
# Heroku 계정 로그인
heroku login

# 새 앱 생성
heroku create team-slack-bot

# 환경변수 설정
heroku config:set SLACK_BOT_TOKEN=xoxb-...
heroku config:set SLACK_SIGNING_SECRET=...

# 배포
git push heroku main

# 로그 확인
heroku logs --tail
```

### AWS/DigitalOcean 배포

서버에 Node.js를 설치하고 프로세스 관리자(PM2 등)를 통해 실행하세요.

## 트러블슈팅

### 토큰 관련 오류

```
Error: token_revoked
```

**해결**: Slack App 설정에서 새 토큰 재발급 후 `.env` 업데이트

### 포트 이미 사용 중

```
Error: listen EADDRINUSE :::3000
```

**해결**: 다른 포트 사용
```bash
PORT=3001 npm run dev
```

### 데이터베이스 오류

```
Error: database is locked
```

**해결**: 다른 프로세스에서 DB를 사용 중. 재시작 필요
```bash
npm run dev
```

## 개발 가이드

더 상세한 개발 정보는 다음 문서를 참고하세요:

- **[CLAUDE.md](./CLAUDE.md)** - Claude Code 개발 규칙 및 아키텍처
- **[BKIT_명령어_가이드.txt](./BKIT_명령어_가이드.txt)** - BKIT 플러그인 사용법
- **[docs/](./docs/)** - PDCA 문서 (기획, 설계, 분석, 보고서)

## 라이센스

MIT

## 기여

버그 리포트나 기능 요청은 이슈를 통해 제출해주세요.

---

**마지막 업데이트**: 2026-04-09  
**프로젝트 상태**: 개발 중 (Phase 1: Project Setup)
