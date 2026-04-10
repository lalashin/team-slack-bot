# Design: Team Slack Bot - Notification Feature

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Architecture** | Slack Bolt 기반 메인 앱에 node-cron 스케줄러를 통합한 모듈식 설계로 알림 기능 추가. |
| **Implementation** | 새로운 `src/schedulers/daily-standup.js` 모듈에서 모든 스케줄 로직을 관리하고, `src/index.js`에서 초기화. |
| **Integration Points** | Slack client, 환경변수 설정, 에러 로깅을 통한 견고한 통합. |
| **Quality** | 모듈 분리로 유지보수성 향상, 에러 처리 및 로깅으로 운영성 확보. |

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│           Main Bot Application                  │
│           (src/index.js)                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────┐  ┌──────────────────────┐   │
│  │ Slack Events  │  │ Notification Module  │   │
│  │ & Commands    │  │ (Scheduler)          │   │
│  │ (existing)    │  │ (NEW)                │   │
│  └───────────────┘  └──────────────────────┘   │
│        │                    │                   │
│        └────────┬───────────┘                   │
│                 │                               │
│         ┌───────▼─────────┐                    │
│         │  Slack Bolt App │                    │
│         │  client.chat    │                    │
│         │  .postMessage() │                    │
│         └───────┬─────────┘                    │
├─────────────────┼─────────────────────────────┤
│                 │                             │
│            Slack API                          │
│         chat.postMessage                      │
└─────────────────────────────────────────────────┘
```

### 1.2 Module Breakdown

#### 1.2.1 Main App Module (`src/index.js`)
- Slack Bolt 앱 초기화
- 환경변수 로드
- 스케줄러 초기화 및 시작
- Express 서버 시작

#### 1.2.2 Scheduler Module (`src/schedulers/daily-standup.js`) - NEW
- Notification 클래스: 모든 알림 로직 관리
- `initScheduler()`: 스케줄러 초기화
- `sendStartupNotification()`: 봇 시작 시 알림 전송
- `scheduleDailyStandup()`: 매일 오전 9시 알림 예약
- `stopScheduler()`: 봇 종료 시 스케줄러 정리

#### 1.2.3 Existing Modules (유지)
- `src/handlers/commands.js`: Slash 명령어 처리
- `src/handlers/events.js`: 이벤트 처리

### 1.3 Data Flow

```
Bot Startup
    │
    ├─ Load .env (SLACK_NOTIFICATION_CHANNEL)
    │
    ├─ Initialize Slack Bolt App
    │
    ├─ Initialize Scheduler Module
    │  ├─ Create Notification instance
    │  ├─ Send Startup Notification
    │  └─ Schedule Daily Standup (cron: 0 9 * * *)
    │
    └─ Start Express Server
           │
           ├─ Wait for Slack Events
           │
           ├─ Every Day at 9:00 AM
           │  └─ Execute Daily Standup Notification
           │
           └─ Bot Shutdown
              └─ Stop Scheduler
```

---

## 2. Detailed Design

### 2.1 File Structure

```
team-slack-bot/
├── src/
│   ├── index.js                        (수정)
│   ├── schedulers/                     (신규 디렉토리)
│   │   └── daily-standup.js            (신규)
│   ├── handlers/
│   │   ├── commands.js                 (기존)
│   │   └── events.js                   (기존)
│   └── config/
│       └── env.js                      (기존)
├── package.json                        (수정)
├── .env.example                        (수정)
├── .env                                (local - git 제외)
└── README.md                           (수정)
```

### 2.2 Scheduler Module Design (`src/schedulers/daily-standup.js`)

#### 2.2.1 Class Structure

```javascript
class NotificationScheduler {
  constructor(slackClient, channelId) {
    this.client = slackClient;
    this.channelId = channelId;
    this.jobs = [];  // cron jobs 추적
  }

  async initScheduler() {
    // 1. Startup 알림 전송
    // 2. Daily Standup 예약
  }

  async sendStartupNotification() {
    // Slack API 호출: chat.postMessage
    // 메시지: "✅ 슬랙봇이 시작되었습니다!"
  }

  scheduleDailyStandup() {
    // cron job 등록: "0 9 * * *"
    // 매일 오전 9시 실행
  }

  stopScheduler() {
    // 모든 cron job 종료
    // 리소스 정리
  }
}
```

#### 2.2.2 Methods Detail

**`constructor(slackClient, channelId)`**
- Slack client 인스턴스 저장
- 알림 채널 ID 설정
- 크론 jobs 배열 초기화

**`async initScheduler()`**
- `sendStartupNotification()` 호출
- `scheduleDailyStandup()` 호출
- 에러 처리: try-catch로 감싸기

**`async sendStartupNotification()`**
```javascript
await this.client.chat.postMessage({
  channel: this.channelId,
  text: '✅ 슬랙봇이 시작되었습니다!',
});
```

**`scheduleDailyStandup()`**
```javascript
const job = cron.schedule('0 9 * * *', async () => {
  try {
    await this.client.chat.postMessage({
      channel: this.channelId,
      text: '🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요.',
    });
  } catch (error) {
    console.error('Daily Standup notification failed:', error);
  }
});
this.jobs.push(job);
```

**`stopScheduler()`**
```javascript
this.jobs.forEach(job => job.stop());
this.jobs = [];
```

### 2.3 Main App Integration (`src/index.js`)

#### 2.3.1 Initialization Flow

```javascript
// 1. 기존 코드
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// 2. 새로운 코드: Scheduler 초기화
const NotificationScheduler = require('./schedulers/daily-standup');

const notificationScheduler = new NotificationScheduler(
  app.client,
  process.env.SLACK_NOTIFICATION_CHANNEL
);

// 3. 스케줄러 시작
(async () => {
  await notificationScheduler.initScheduler();
})();

// 4. 봇 종료 시 정리
process.on('SIGTERM', () => {
  notificationScheduler.stopScheduler();
  process.exit(0);
});
```

### 2.4 Environment Variables

#### 2.4.1 `.env` Configuration

```env
# 기존 변수
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret

# 신규 변수
SLACK_NOTIFICATION_CHANNEL=C0123456789
```

#### 2.4.2 Environment Variable Validation

```javascript
if (!process.env.SLACK_NOTIFICATION_CHANNEL) {
  throw new Error('SLACK_NOTIFICATION_CHANNEL must be set');
}
```

### 2.5 Dependencies

#### 2.5.1 Package.json Update

```json
{
  "dependencies": {
    "@slack/bolt": "^3.13.0",
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "node-cron": "^3.0.2"  // NEW
  }
}
```

#### 2.5.2 Installation Command

```bash
npm install node-cron
```

### 2.6 Error Handling Strategy

#### 2.6.1 Error Scenarios

| Scenario | Handling |
|----------|----------|
| Slack API 호출 실패 | try-catch, 에러 로그 기록 |
| 환경변수 누락 | 앱 시작 시 에러 발생 후 중단 |
| 채널 ID 유효하지 않음 | Slack API 에러, 로그 기록 |
| 스케줄러 시작 실패 | console.error 로그 |

#### 2.6.2 Logging

```javascript
// 성공
console.log('[Scheduler] Startup notification sent');
console.log('[Scheduler] Daily Standup scheduled at 0 9 * * *');

// 에러
console.error('[Scheduler] Failed to send startup notification:', error);
console.error('[Scheduler] Daily Standup execution failed:', error);
```

---

## 3. Implementation Order

### Phase 1: Dependency Installation
1. `npm install node-cron` 실행
2. `package.json`에 `node-cron` 자동 추가

### Phase 2: Scheduler Module Creation
1. `src/schedulers/` 디렉토리 생성
2. `src/schedulers/daily-standup.js` 파일 생성
3. `NotificationScheduler` 클래스 구현
4. 모든 메서드 구현 (초기화, 알림 전송, 스케줄링, 정리)

### Phase 3: Main App Integration
1. `src/index.js` 수정
2. `NotificationScheduler` import 추가
3. 스케줄러 인스턴스 생성 및 초기화
4. 프로세스 종료 핸들러 추가

### Phase 4: Environment Configuration
1. `.env.example` 수정 (SLACK_NOTIFICATION_CHANNEL 추가)
2. `.env` 파일 업데이트 (로컬 채널 ID 설정)

### Phase 5: Documentation Update
1. README.md 업데이트
2. Notification 기능 설명 추가

### Phase 6: Testing
1. 로컬 봇 실행
2. Startup 알림 확인
3. 시간 변경하여 Daily Standup 알림 테스트

---

## 4. API Design

### 4.1 Slack API Usage

#### Method: `chat.postMessage`

```javascript
await client.chat.postMessage({
  channel: string,        // 채널 ID (예: C0123456789)
  text: string,          // 메시지 텍스트
  // 선택사항:
  // blocks: Array,      // 리치 메시지 (향후 개선)
  // thread_ts: string,  // 스레드에 보내기
});
```

**Rate Limit**: 1 RPS (충분함)

**Response**:
```javascript
{
  ok: true,
  channel: "C123456789",
  ts: "1503435956.000247",
  message: {
    text: "메시지 내용",
    type: "message",
    ...
  }
}
```

### 4.2 Error Handling

**Common Errors**:
- `channel_not_found`: 채널 ID가 유효하지 않음
- `not_in_channel`: 봇이 채널에 없음
- `permission_denied`: 봇 권한 부족
- `rate_limited`: API 속도 제한 (재시도 필요)

---

## 5. Cron Expression

### 5.1 Daily Standup Cron

**Expression**: `0 9 * * *`

| Field | Value | Meaning |
|-------|-------|---------|
| Minute | 0 | 0분 |
| Hour | 9 | 9시 (24시간 형식) |
| Day of Month | * | 매일 |
| Month | * | 매월 |
| Day of Week | * | 요일 상관없음 |

**Result**: 매일 오전 9시 정확히 실행

### 5.2 Testing with Different Cron

테스트용 (현재 시간 + 1분):
```javascript
// 예: 현재 시간이 14:30이면
// '31 14 * * *' 로 설정하여 1분 후 테스트
```

---

## 6. Database / State Management

### 6.1 No Database Required

- 알림은 상태 저장 필요 없음
- 크론 작업은 메모리에서만 관리
- 봇 재시작 시 스케줄러 자동 초기화

### 6.2 Future Enhancement (Out of Scope)

- 알림 히스토리 저장 (SQLite/PostgreSQL)
- 사용자별 알림 선호도 관리
- 알림 실패 재시도 로직

---

## 7. Security Considerations

### 7.1 Token Management
- `SLACK_BOT_TOKEN` 환경변수로 관리 (git 제외)
- `.env` 파일은 `.gitignore`에 포함

### 7.2 Channel ID Validation
- 환경변수 로드 시 유효성 검증
- 잘못된 채널 ID는 Slack API 에러로 감지

### 7.3 Error Logging
- 민감 정보 (토큰) 로그에 포함 금지
- 에러 메시지에는 채널 ID만 포함

---

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

#### Startup Notification
- [ ] 봇 시작
- [ ] Slack 채널에서 "✅ 슬랙봇이 시작되었습니다!" 확인

#### Daily Standup Notification
- [ ] 크론 시간을 현재 시간 + 1분으로 변경
- [ ] 1분 후 Slack 채널 확인
- [ ] "🌅 Daily Standup 시간입니다! ..." 메시지 수신

#### Environment Variables
- [ ] `.env` 파일에서 채널 ID 변경
- [ ] 봇 재시작 후 알림이 새 채널로 전송되는지 확인

#### Existing Features
- [ ] `/todo` 명령어 작동 확인
- [ ] `/list` 명령어 작동 확인
- [ ] `/status` 명령어 작동 확인
- [ ] `/help` 명령어 작동 확인

### 8.2 Error Testing

- Slack API 실패 시 에러 로그 기록 확인
- 환경변수 누락 시 앱 시작 실패 확인

---

## 9. Deployment Notes

### 9.1 Production Environment

```env
SLACK_BOT_TOKEN=xoxb-prod-token
SLACK_SIGNING_SECRET=prod-signing-secret
SLACK_NOTIFICATION_CHANNEL=C_PROD_CHANNEL_ID
PORT=3000
```

### 9.2 Time Zone Consideration

- 크론 시간은 **서버의 시스템 시간**에 의존
- 배포 시 서버 시간대가 KST(UTC+9)로 설정되어 있는지 확인

```bash
# Linux 확인
date
# 또는
timedatectl
```

### 9.3 Monitoring

- Slack 채널에서 알림 수신 확인
- 봇 로그에서 에러 메시지 모니터링
- 매주 1회 수동 확인

---

## 10. Compatibility & Constraints

### 10.1 Compatibility

- ✅ Slack Bolt 3.x 이상 지원
- ✅ Node.js 14+ 지원
- ✅ 기존 명령어와 완전 호환

### 10.2 Constraints

- ⚠️ 봇이 실행 중일 때만 스케줄 작동
- ⚠️ 시간대는 서버 시스템 시간 의존
- ⚠️ 여러 봇 인스턴스 실행 시 중복 알림 가능 (향후 해결)

---

## 11. Future Enhancements (Out of Scope)

1. **Rich Message Format**: Slack blocks을 사용한 리치 메시지
2. **Multiple Notifications**: 여러 시간대 알림 지원
3. **Notification History**: SQLite에 알림 로그 저장
4. **User Preferences**: 사용자별 알림 설정
5. **Graceful Shutdown**: 봇 종료 시 pending 알림 처리

---

## 12. Document References

- **Plan Document**: `docs/01-plan/features/notification-feature.plan.md`
- **Implementation Guide**: Will be in Do phase
- **Analysis & Report**: Will be in Check & Report phases

---

**Design Status**: Complete  
**Next Phase**: Do (Implementation)  
**Created**: 2026-04-10
