# Socket Mode 가이드

## 개요

Socket Mode는 로컬 개발 환경에서 ngrok 없이 Slack 봇을 실행할 수 있는 방식입니다.

## 에러 해결

### "Error: Unhandled event 'server explicit disconnect' in state 'connecting'"

이 에러는 다음 상황에서 발생합니다:
- Slack 서버가 연결을 명시적으로 종료할 때
- 네트워크 불안정으로 인한 비정상 종료
- 토큰 만료 또는 권한 부족

**해결 방법** (이미 적용됨):
1. SocketModeReceiver 클라이언트 이벤트 리스너 추가
   - `connected`, `disconnected`, `error`, `close` 이벤트 처리
   - 올바른 객체: `app.receiver.client` (SocketModeClient)
2. Bolt 앱 레벨 에러 핸들러 추가
   - `app.error()` 핸들러로 모든 Bolt 에러 포착
3. 글로벌 에러 핸들러 추가
   - `unhandledRejection`, `uncaughtException` 처리
4. Graceful shutdown 구현
   - SIGTERM/SIGINT에서 `app.stop()` 호출로 정상 종료

## 설정 방법

### 1. App-Level Token 발급

1. [api.slack.com](https://api.slack.com)에서 앱 선택
2. **Basic Information** → **App-Level Tokens** 이동
3. **Generate Token and Scopes** 버튼 클릭
4. 스코프 선택:
   - `connections:write` (필수)
   - `connections:read` (권장)
5. 토큰 복사 (xapp-로 시작)

### 2. 환경 변수 설정

`.env` 파일에 다음 추가:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-level-token  # Socket Mode 활성화
```

**`SLACK_APP_TOKEN` 설정 시 자동으로 Socket Mode 활성화됨**

### 3. 실행

```bash
npm run dev
```

## 로그 확인

Socket Mode 연결 상태를 로그로 확인:

```
Socket Mode connection established
```

비정상 종료 시:
```
Socket Mode disconnected (reason)
Socket Mode connection closed (code: 1000)
```

## 문제 해결

| 증상 | 원인 | 해결책 |
|------|------|------|
| "invalid token" | App-Level Token 오류 | Token 재발급 후 교체 |
| "unauthorized" | 권한 부족 | Scopes에 `connections:write` 추가 |
| 자주 끊김 | 네트워크 불안정 | 로그 확인, 재시작 |
| 이벤트 미수신 | 권한 부족 | Bot Event Subscriptions 확인 |

## HTTP Mode 전환

Socket Mode를 사용하지 않으려면:
- `.env`에서 `SLACK_APP_TOKEN` 제거 또는 주석 처리
- 서버가 공개 URL에서 실행되어야 함 (ngrok 사용)

```bash
# HTTP Mode로 실행
npm start
```

## 참고 자료

- [Slack Bolt Socket Mode 문서](https://slack.dev/bolt-js/concepts#socket-mode)
- [Socket Mode 개념](https://api.slack.com/apis/connections/socket)
- [App-Level Tokens](https://api.slack.com/authentication/token-types#app)
