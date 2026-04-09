# Slack 앱 — 슬래시 커맨드 등록 가이드

Slack은 **앱에 등록된 슬래시 커맨드만** 워크스페이스에서 유효한 명령으로 인식합니다. 코드에 `app.command('/todo', …)` 가 있어도, 아래 설정이 없으면 사용자가 `/todo`를 입력했을 때 **Slackbot이 “유효한 명령이 아닙니다”**라고 안내합니다.

---

## 1. 전제

- [Slack API — Your Apps](https://api.slack.com/apps) 에서 **본인이 만든 앱**을 연다.
- 변경 후에는 보통 **워크스페이스에 앱 재설치(Reinstall)** 가 필요하다.

---

## 2. 슬래시 커맨드 추가 절차

1. 해당 앱 선택 → 왼쪽 메뉴 **Slash Commands** (슬래시 명령).
2. **Create New Command** (또는 동일 의미 버튼) 클릭.
3. 아래 네 가지를 **각각** 한 번씩 만든다 (이름은 코드와 동일해야 함).

| Command   | 설명 (예시)   | 비고        |
|-----------|---------------|-------------|
| `/todo`   | 작업 추가     |             |
| `/list`   | 작업 목록     |             |
| `/status` | 봇 상태       |             |
| `/help`   | 도움말        |             |

4. **Request URL** (요청 URL)  
   - **HTTP(Event) 방식**: 공개 HTTPS URL (예: `https://xxxx.ngrok-free.app/slack/events`) 을 넣는다. Bolt 기본 경로는 보통 `/slack/events` 한 개로 이벤트·슬래시가 함께 처리되는 구성이 많다.  
   - **Socket Mode** 사용 시: Slack UI 버전에 따라 Request URL이 비활성이거나 안내 문구만 표시될 수 있다. 소켓으로 이벤트를 받는 설정이면 커맨드도 동일 앱으로 연결된다.

5. 각 커맨드 **저장(Save)**.

---

## 3. 재설치

1. **OAuth & Permissions** 로 이동.
2. 상단 **Install to Workspace** 또는 **Reinstall to Workspace** 실행.
3. 권한 확인 후 설치 완료.

---

## 4. 사용 방법 (사용자 쪽)

- 채널 입력창 **맨 앞**에서 `/` 입력 → 목록에 `/todo` 등이 보이면 등록된 것이다.
- `/todo 회의 준비` 처럼 **명령 뒤에 인자**를 붙인다.
- `@봇 /todo` 처럼 **멘션과 같은 줄에만** 쓰면 일반 메시지로 처리될 수 있으므로, **먼저 `/`로 시작하는 줄**에 쓰는 것을 권장한다.

---

## 5. 문제 해결

| 증상 | 확인 |
|------|------|
| “유효한 명령이 아닙니다” | 해당 이름이 Slash Commands에 없거나 오타, 다른 워크스페이스 |
| 커맨드는 뜨는데 응답 없음 | 로컬에서 봇 프로세스 실행 여부, Socket/HTTP URL·토큰, 재설치 여부 |
| 예전엔 됐는데 안 됨 | 앱 설정 변경 후 재설치 누락, 토큰 만료 |

---

## 6. 참고 링크

- [Slack API — Slash commands](https://api.slack.com/interactivity/slash-commands)
- 프로젝트 구현: `src/handlers/commands.js`, `src/handlers/index.js`
