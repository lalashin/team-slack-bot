# Plan: Team Slack Bot - Notification Feature

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Problem** | 팀 협업에서 정기적인 스탠드업이나 중요 알림이 자동으로 전달되지 않아 팀원들이 수동으로 알림을 관리해야 함. |
| **Solution** | node-cron을 사용한 스케줄링 기능으로 매일 오전 9시 Daily Standup 알림과 봇 시작 시 확인 메시지를 자동 전송. |
| **Function UX Effect** | 정해진 시간에 자동으로 알림이 전달되어 팀원들이 스탠드업을 놓치지 않음. 봇 상태를 즉시 확인 가능. |
| **Core Value** | 수동 알림 관리 제거, 팀 커뮤니케이션 일관성 강화, 운영 복잡도 감소. |

---

## 1. Feature Overview

### 1.1 Feature Name
Notification Feature - Slack Bot 자동 알림 시스템

### 1.2 Feature Description
기존 Team Slack Bot에 정기적인 알림 기능을 추가합니다. node-cron 라이브러리를 사용하여 일정한 시간에 Slack 채널로 자동 메시지를 전송하고, 봇 시작 시 테스트 메시지를 전달합니다.

### 1.3 Target Users
- 팀 리더/매니저 (Daily Standup 주최자)
- 모든 팀원 (알림 수신자)
- 봇 관리자 (배포 및 모니터링)

### 1.4 Business Goals
- 일일 스탠드업 자동화로 팀 회의 관리 효율화
- 정기적 알림으로 팀 커뮤니케이션 일관성 확보
- 봇 상태 모니터링으로 운영 투명성 강화

---

## 2. Feature Scope

### 2.1 In Scope
- **Daily Standup Notification**: 매일 오전 9시에 지정된 채널에 자동 메시지 전송
  - 메시지: "🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요."
  - Slack API `chat.postMessage` 사용
  - 환경변수 `SLACK_NOTIFICATION_CHANNEL`로 채널 ID 설정 가능

- **Startup Notification**: 봇 시작 시 즉시 테스트 메시지 전송
  - 메시지: "✅ 슬랙봇이 시작되었습니다!"
  - 같은 채널 또는 관리자 채널로 전송 가능

- **Scheduler Integration**: node-cron을 사용한 크론 작업 관리
  - 크론 표현식: `0 9 * * *` (매일 오전 9시)
  - 봇 시작 시 자동으로 스케줄러 시작

### 2.2 Out of Scope
- 복잡한 알림 규칙 (조건부 알림, 사용자별 맞춤 알림)
- 알림 빈도 조정 UI
- 알림 히스토리 추적 및 분석
- 다중 시간대 지원
- 봇이 종료되는 동안의 스케줄링 보장 (로컬 시간에만 의존)

### 2.3 Phase-wise Breakdown
1. **Phase 1**: 의존성 설치 (node-cron, @slack/bolt)
2. **Phase 2**: 알림 모듈 생성 (`src/modules/notifications.js` 또는 `src/services/scheduler.js`)
3. **Phase 3**: Startup Notification 구현
4. **Phase 4**: Daily Standup Notification 구현
5. **Phase 5**: 환경변수 설정 및 문서화
6. **Phase 6**: 테스트 및 배포

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-101 | 매일 오전 9시에 Daily Standup 알림 전송 | 높음 |
| FR-102 | 봇 시작 시 Startup 알림 전송 | 높음 |
| FR-103 | 환경변수로 채널 ID 설정 가능 | 높음 |
| FR-104 | 알림 전송 실패 시 로그 기록 | 중간 |
| FR-105 | 기존 `/todo`, `/list`, `/status`, `/help` 명령어 유지 | 높음 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-101 | 알림 전송 지연 < 100ms (Slack API 호출 제외) | 중간 |
| NFR-102 | 봇 재시작 후 스케줄러 자동 복구 | 높음 |
| NFR-103 | 크론 작업 실패 시 에러 로깅 | 중간 |
| NFR-104 | 메모리 누수 방지 (스케줄러 정리) | 높음 |

---

## 4. Technical Stack

### 4.1 Dependencies

**신규 추가**:
- `node-cron` ^3.0.0 - 스케줄링 라이브러리
- 기존 의존성 유지:
  - `@slack/bolt` - Slack 공식 SDK
  - `express` 또는 `hono` - 웹 프레임워크
  - `dotenv` - 환경변수 관리

### 4.2 Architecture Pattern

```
┌─────────────────────────────────────────────┐
│         app.js (Main Bot Entry)             │
├─────────────────────────────────────────────┤
│ ├─ Slack Event Handlers (기존)              │
│ ├─ Slash Commands (기존)                    │
│ └─ Scheduler Module (신규)                  │
│     ├─ initScheduler()                      │
│     ├─ startupNotification()                │
│     └─ dailyStandupNotification()           │
├─────────────────────────────────────────────┤
│         Slack API (chat.postMessage)        │
└─────────────────────────────────────────────┘
```

### 4.3 Environment Variables

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_NOTIFICATION_CHANNEL=C0123456789  # 알림 채널 ID
PORT=3000
```

---

## 5. Implementation Plan

### 5.1 Detailed Feature Breakdown

#### 5.1.1 Startup Notification
```javascript
// 봇 시작 시 실행
async function sendStartupNotification() {
  await client.chat.postMessage({
    channel: SLACK_NOTIFICATION_CHANNEL,
    text: '✅ 슬랙봇이 시작되었습니다!',
  });
}
```

#### 5.1.2 Daily Standup Notification
```javascript
// 매일 오전 9시 실행
cron.schedule('0 9 * * *', async () => {
  await client.chat.postMessage({
    channel: SLACK_NOTIFICATION_CHANNEL,
    text: '🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요.',
  });
});
```

#### 5.1.3 Scheduler Module
```javascript
// src/services/notifications.js 또는 src/modules/notifications.js
class NotificationScheduler {
  constructor(slackClient) { /* ... */ }
  
  initScheduler() {
    this.startupNotification();
    this.scheduleDailyStandup();
  }
  
  async startupNotification() { /* ... */ }
  async scheduleDailyStandup() { /* ... */ }
  stopScheduler() { /* 정리 작업 */ }
}
```

### 5.2 File Structure Changes

```
team-slack-bot/
├── src/
│   ├── app.js                    (기존 - 수정)
│   ├── handlers/                 (기존)
│   │   ├── commands.js           (기존)
│   │   └── events.js             (기존)
│   ├── services/                 (신규 디렉토리)
│   │   └── notifications.js      (신규 파일 - 알림 스케줄링)
│   └── config/                   (기존)
├── .env.example                  (수정 - 환경변수 추가)
├── package.json                  (수정 - node-cron 추가)
└── README.md                      (수정 - 알림 기능 문서화)
```

### 5.3 Timeline

| Phase | Task | Duration | Owner |
|-------|------|----------|-------|
| 1 | `npm install node-cron` | 1시간 | 개발자 |
| 2 | Scheduler 모듈 생성 (`notifications.js`) | 2시간 | 개발자 |
| 3 | Startup 알림 구현 및 테스트 | 1.5시간 | 개발자 |
| 4 | Daily Standup 알림 구현 및 테스트 | 1.5시간 | 개발자 |
| 5 | 환경변수 설정 및 문서화 | 1시간 | 개발자 |
| 6 | 통합 테스트 및 배포 | 2시간 | 개발자 |
| **Total** | | **9시간** | |

### 5.4 Key Deliverables

1. ✅ `package.json` 업데이트 (node-cron 추가)
2. ✅ `src/services/notifications.js` 모듈 생성
3. ✅ `app.js`에 스케줄러 초기화 코드 추가
4. ✅ `.env.example` 업데이트 (SLACK_NOTIFICATION_CHANNEL 추가)
5. ✅ README.md 업데이트 (알림 기능 설명)
6. ✅ 테스트 및 배포 확인

### 5.5 Resource Requirements

- 개발자: 1명
- 테스트 Slack 워크스페이스
- 배포 환경 (기존과 동일)

---

## 6. Success Criteria

### 6.1 Acceptance Criteria

- ✅ 봇 시작 시 Startup 알림이 지정된 채널에 전송됨
- ✅ 매일 오전 9시에 Daily Standup 알림이 자동 전송됨
- ✅ 알림 메시지가 사전 정의된 형식과 일치
- ✅ 환경변수로 채널 ID를 변경할 수 있음
- ✅ 기존 `/todo`, `/list`, `/status`, `/help` 명령어가 정상 작동
- ✅ 알림 전송 실패 시 에러가 로그에 기록됨

### 6.2 Quality Metrics

- 알림 전송 성공률: 99% 이상
- 에러 로그: 명확한 메시지 포함
- 코드 관리: 깔끔한 모듈 분리

---

## 7. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Slack API 호출 실패 | 중간 | 높음 | 재시도 로직 및 에러 로깅 구현 |
| 시간대 오류 (UTC vs 로컬 시간) | 중간 | 중간 | 환경 배포 시 시간대 설정 확인 |
| 스케줄러 메모리 누수 | 낮음 | 높음 | 봇 종료 시 스케줄러 정리 |
| 크론 표현식 실수 | 낮음 | 중간 | 단위 테스트 및 문서화 |

---

## 8. Dependencies & Constraints

### 8.1 External Dependencies

- `node-cron` 라이브러리
- Slack API (공식 제공)
- Node.js 런타임

### 8.2 Constraints

- 봇이 실행 중일 때만 스케줄링 작동
- 시간대는 봇 서버의 시스템 시간에 의존
- Rate limiting: Slack API 호출 제한 (일반적으로 충분함)

### 8.3 Dependencies from Existing Features

- 기존 Slack Bot 연결 유지 필수
- `app.js`의 Slack client 객체 접근 필요
- 환경변수 관리 시스템 활용

---

## 9. API & Integration Points

### 9.1 Slack API Usage

**Method**: `chat.postMessage`

```javascript
await client.chat.postMessage({
  channel: process.env.SLACK_NOTIFICATION_CHANNEL,
  text: '알림 메시지',
});
```

**Rate Limit**: 1 RPS (충분함)

---

## 10. Testing Strategy

### 10.1 Manual Testing

1. **Startup 알림**
   - 봇 실행
   - Slack 채널에서 "✅ 슬랙봇이 시작되었습니다!" 메시지 확인

2. **Daily Standup 알림** (테스트용)
   - 크론 시간을 현재 시간 + 1분으로 변경하여 테스트
   - 또는 수동 함수 호출로 테스트

3. **환경변수**
   - `.env` 파일에서 `SLACK_NOTIFICATION_CHANNEL` 변경
   - 다른 채널로 알림 전송 확인

### 10.2 Edge Cases

- Slack API 호출 실패 시 에러 로그
- 봇 재시작 후 스케줄러 자동 복구
- 여러 봇 인스턴스 실행 시 중복 알림 방지 (필요시)

---

## 11. Next Steps

1. ✅ Plan 문서 완성
2. → Design 문서 작성 (모듈 구조, API 설계 상세화)
3. → 구현 시작 (Do phase)
4. → 테스트 및 검증 (Check & Report phase)

---

## 12. Document History

| 버전 | 작성일 | 주요 변경 |
|------|--------|---------|
| 1.0 | 2026-04-10 | 초안 작성 |

---

**Status**: Plan Complete  
**Next Phase**: Design
