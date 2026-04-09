# Design: Team Slack Bot

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Architecture** | Event-driven 아키텍처로 Slack 이벤트를 실시간으로 처리 |
| **Core Components** | Bot Server, Command Handler, Event Listener, Data Store |
| **API Design** | RESTful API 기반의 Slack Bolt SDK 활용 |
| **Data Model** | In-memory + persistent storage (SQLite) 이중 구조 |

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Slack Workspace                      │
│  (Commands, Events, Message Reactions)                 │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST (Events API)
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Slack Bot Server                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ @slack/bolt App                                  │  │
│  │  - Event Router                                  │  │
│  │  - Command Handler                               │  │
│  │  - Message Listener                              │  │
│  └──────────┬──────────────────────────┬────────────┘  │
│             ↓                          ↓                │
│  ┌──────────────────┐    ┌───────────────────────┐    │
│  │ Command Handler  │    │ Event Handler         │    │
│  │ - /todo          │    │ - reaction_added      │    │
│  │ - /list          │    │ - message events      │    │
│  │ - /status        │    │ - app_mention        │    │
│  └────────┬─────────┘    └───────────┬───────────┘    │
│           ↓                          ↓                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data Service Layer                               │  │
│  │ - Task Management                                │  │
│  │ - User State                                     │  │
│  │ - Event Logging                                  │  │
│  └────────┬─────────────────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ Data Storage Layer                                      │
│ ┌──────────────┐              ┌──────────────┐         │
│ │ In-Memory    │ (Session)    │ SQLite DB    │ (Persist)
│ │ Cache        │              │ - tasks      │         │
│ │ - active     │              │ - users      │         │
│ │   sessions   │              │ - logs       │         │
│ └──────────────┘              └──────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Design Pattern: Event-Driven Architecture

**패턴**: Observer Pattern + Command Pattern

- **Event Subscriptions**: Slack에서 발생하는 모든 이벤트를 구독
- **Command Processing**: 각 명령어별 핸들러로 처리
- **Async Processing**: 모든 처리를 비동기로 수행 (Promise/async-await)

---

## 2. Component Design

### 2.1 Slack Bot Server (`src/app.js`)

**책임**:
- Slack App 초기화
- 포트 리스닝 (기본값: 3000)
- 이벤트 라우팅

**구현**:
```javascript
// src/app.js
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // HTTP 모드
  port: process.env.PORT || 3000
});

// Event listeners 등록
app.event('app_mention', handlers.handleMention);
app.command('/todo', handlers.handleTodoCommand);
app.action('button_click', handlers.handleActions);

module.exports = app;
```

### 2.2 Command Handler (`src/handlers/commands.js`)

**지원 명령어**:

| 명령어 | 설명 | 입력 | 응답 |
|--------|------|------|------|
| `/todo` | 작업 추가 | `/todo "작업명"` | 작업 ID와 확인 메시지 |
| `/list` | 작업 목록 | `/list [status]` | 작업 목록 (필터링 가능) |
| `/status` | 봇 상태 | `/status` | 봇 정보, 활성 작업 수 |
| `/help` | 도움말 | `/help` | 사용 가능한 명령어 |

**구현 구조**:
```
src/handlers/commands.js
├── handleTodoCommand(command, ack, respond)
│   ├── 입력 검증
│   ├── 작업 생성
│   └── 응답 전송
├── handleListCommand(command, ack, respond)
│   ├── 필터링 로직
│   └── 포매팅 및 응답
└── handleStatusCommand(command, ack, respond)
    └── 시스템 상태 조회
```

### 2.3 Event Handler (`src/handlers/events.js`)

**처리 이벤트**:

| 이벤트 | 목적 | 처리 로직 |
|--------|------|---------|
| `app_mention` | 봇 멘션 감지 | 인사말 또는 도움말 응답 |
| `reaction_added` | 반응으로 상태 변경 | 작업 상태 업데이트 |
| `message` | 메시지 모니터링 | (향후 확장) |

### 2.4 Data Service (`src/services/dataService.js`)

**역할**: 데이터 접근 계층 추상화

```javascript
// 작업 관련
- createTask(userId, title, description)
- getTask(taskId)
- updateTask(taskId, updates)
- deleteTask(taskId)
- listTasks(filters)

// 사용자 관련
- createUser(userId, userName)
- getUser(userId)
- updateUserState(userId, state)

// 로깅
- logEvent(eventType, metadata)
```

### 2.5 Database Schema (`SQLite`)

**테이블 1: tasks**
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' (open | in_progress | done),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP
);
```

**테이블 2: users**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  slack_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**테이블 3: events_log**
```sql
CREATE TABLE events_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  task_id TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. API Design

### 3.1 Slack Command API

**Request Format**:
```
POST /slack/events
Headers: 
  - X-Slack-Request-Timestamp: {timestamp}
  - X-Slack-Signature: {signature}
Body:
  {
    "token": "...",
    "team_id": "...",
    "user_id": "...",
    "command": "/todo",
    "text": "작업 제목",
    "response_url": "...",
    "trigger_id": "..."
  }
```

**Response Format**:
```json
{
  "response_type": "in_channel",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "✅ 작업이 추가되었습니다."
      }
    }
  ]
}
```

### 3.2 Slack Event API

**Event Subscription Pattern**:
```
POST /slack/events (Slack → Bot Server)
{
  "token": "...",
  "team_id": "...",
  "event": {
    "type": "reaction_added",
    "user": "U123456",
    "reaction": "white_check_mark",
    "item": { "type": "message", "channel": "C123" }
  }
}
```

---

## 4. Implementation Order

### Phase 1: Project Setup (Week 1)
- [ ] Git 저장소 초기화
- [ ] `package.json` 생성 및 의존성 설치
- [ ] 환경변수 설정 (`.env.example`)
- [ ] README.md 작성

**Deliverables**:
- `package.json` 
- `.env.example`
- `src/app.js` (기본 구조)
- `README.md`

### Phase 2: Core Bot Setup (Week 1-2)
- [ ] Slack Bolt 초기화
- [ ] 포트 리스닝 설정
- [ ] 기본 이벤트 핸들러 등록
- [ ] 응답 형식 정의

**Deliverables**:
- `src/app.js` (완성)
- `src/config/slack.js` (Slack 설정)

### Phase 3: Command Implementation (Week 2)
- [ ] `/todo` 명령어 구현
- [ ] `/list` 명령어 구현
- [ ] `/help` 명령어 구현
- [ ] 입력 검증

**Deliverables**:
- `src/handlers/commands.js`
- `src/utils/validators.js`

### Phase 4: Data Storage (Week 2-3)
- [ ] SQLite 초기화
- [ ] 스키마 생성
- [ ] Data Service 구현
- [ ] 작업 CRUD 작업

**Deliverables**:
- `src/db/init.js`
- `src/services/dataService.js`

### Phase 5: Event Handling (Week 3)
- [ ] 반응 이벤트 핸들러 구현
- [ ] 상태 변경 로직
- [ ] 메시지 포매팅

**Deliverables**:
- `src/handlers/events.js`

### Phase 6: Testing & Polish (Week 3-4)
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 오류 처리
- [ ] 로깅

**Deliverables**:
- `tests/` 디렉토리
- Error handling 개선

### Phase 7: Deployment (Week 4)
- [ ] 배포 환경 설정
- [ ] 배포 가이드 작성
- [ ] 모니터링 설정

**Deliverables**:
- `deploy.md`
- Docker/Procfile (선택)

---

## 5. Key Design Decisions

### 5.1 왜 Event-Driven 아키텍처인가?
- **장점**: 
  - Slack 이벤트를 실시간으로 처리
  - 확장성 높음 (이벤트 핸들러 추가 용이)
  - 느슨한 결합 (각 핸들러 독립적)
  
- **단점**:
  - 복잡도 증가
  - 디버깅 어려움

### 5.2 왜 SQLite를 선택했는가?
- **장점**:
  - 설치 간편
  - 소규모 프로젝트에 충분
  - 파일 기반 (쉬운 백업)

- **단점**:
  - 동시성 제한
  - 향후 PostgreSQL로 마이그레이션 필요할 수 있음

### 5.3 In-Memory Cache + Persistent Storage
- **세션 데이터**: In-memory (빠른 응답)
- **영구 데이터**: SQLite (복구 가능)

---

## 6. Error Handling Strategy

### 6.1 Error Types

| 에러 타입 | 처리 방식 | 사용자 메시지 |
|----------|---------|-------------|
| 입력 검증 실패 | 400 Bad Request | "입력이 올바르지 않습니다." |
| 데이터베이스 오류 | 500 Internal Server | "일시적인 오류가 발생했습니다." |
| Slack API 오류 | 503 Service Unavailable | "Slack 연결에 문제가 있습니다." |
| 인증 오류 | 401 Unauthorized | "권한이 없습니다." |

### 6.2 Logging Strategy

```javascript
// 레벨별 로깅
- ERROR: 시스템 오류
- WARN: 잠재적 문제
- INFO: 주요 이벤트
- DEBUG: 상세 정보 (개발 환경)
```

---

## 7. Security Considerations

### 7.1 Slack Token Management
- 환경변수로 관리 (절대 하드코딩 금지)
- 정기적인 토큰 회전
- 토큰 누출 시 즉시 재발급

### 7.2 Request Verification
- Slack의 서명 검증 필수
- 타임스탬프 검증 (3초 이내)

### 7.3 Data Protection
- 사용자 정보 암호화 저장 (향후)
- SQL Injection 방지 (prepared statements 사용)

---

## 8. Performance Considerations

### 8.1 Response Time Target
- 목표: < 1초 응답 시간
- Slack은 3초 이내 응답 필요

### 8.2 Optimization Strategies
- In-memory cache 사용
- 데이터베이스 쿼리 최적화
- 배치 처리 (향후)

---

## 9. Scalability Plan

### 9.1 현재 (Phase 1-2)
- 단일 서버
- SQLite (로컬 파일)
- 소규모 팀 (< 100명)

### 9.2 향후 확장 (Phase 3+)
- 여러 워크스페이스 지원
- PostgreSQL 마이그레이션
- Redis 캐싱
- 로드 밸런싱

---

## 10. Monitoring & Logging

### 10.1 Key Metrics
- 명령어 실행 시간
- 오류율
- 활성 사용자 수
- 작업 생성 속도

### 10.2 Logging Framework
- 라이브러리: `winston` 또는 `pino`
- 로그 저장: 파일 또는 외부 서비스
- 로그 레벨: DEBUG, INFO, WARN, ERROR

---

## 11. Dependencies & Libraries

### 11.1 Required Libraries
```json
{
  "@slack/bolt": "^3.0.0",
  "express": "^4.18.0",
  "sqlite3": "^5.1.0",
  "dotenv": "^16.0.0"
}
```

### 11.2 Development Dependencies
```json
{
  "jest": "^29.0.0",
  "nodemon": "^2.0.0",
  "eslint": "^8.0.0"
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests
- 각 함수별 테스트
- Mock Slack API 사용

### 12.2 Integration Tests
- 실제 Slack 테스트 워크스페이스 사용
- 명령어 + 이벤트 통합 테스트

### 12.3 Test Coverage Goal
- 목표: 70% 이상

---

## 13. Documentation Plan

### 13.1 코드 문서화
- JSDoc 주석 사용
- README.md 가이드

### 13.2 API 문서화
- 명령어별 사용법
- 응답 형식 예제
- 오류 메시지 가이드

---

## 14. Next Steps

1. ✅ Plan 문서 완성
2. ✅ Design 문서 완성
3. → 구현 시작 (Do phase)
   - 프로젝트 초기화 (package.json, .env)
   - Slack Bot 기본 설정
   - 명령어 및 이벤트 핸들러 구현
4. → Gap 분석 및 개선 (Check phase)
5. → 배포 및 보고서 (Report phase)

---

**Created**: 2026-04-09  
**Status**: Design Complete  
**Next Phase**: Do (Implementation)
