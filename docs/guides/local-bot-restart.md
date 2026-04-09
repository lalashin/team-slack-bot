# PC 재시작·전원 OFF 후 봇 다시 실행하기

로컬에서 돌리는 **Team Slack bot**은 **이 PC에서 `npm run dev`가 실행 중일 때만** Slack과 연결됩니다. 전원을 끄거나 재부팅하면 프로세스가 종료되므로, 아래 순서로 다시 켜면 됩니다.

---

## 사전 확인

- [ ] **Node.js** 설치됨 (`node -v` — 18 이상 권장)
- [ ] 프로젝트 폴더에 **`.env`** 파일이 있다 (`.env.example` 복사본).  
  - `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` 필수  
  - Socket Mode 사용 시 **`SLACK_APP_TOKEN`** (`xapp-`) 도 필요

`.env`가 없거나 백업만 있으면: `.env.example`을 복사해 이름을 `.env`로 바꾼 뒤 토큰을 다시 채운다.

---

## 실행 순서 (Windows PowerShell 기준)

1. **터미널**을 연다 (Cursor 터미널 또는 PowerShell).

2. **프로젝트 루트**로 이동한다.  
   예:
   ```powershell
   cd D:\pre_claude-code-lectures\cursor\team-slack-bot
   ```

3. (선택) 의존성을 처음 받거나 `package.json`이 바뀌었다면:
   ```powershell
   npm install
   ```

4. **개발 모드로 봇 실행**:
   ```powershell
   npm run dev
   ```

5. **정상 기동 확인** — 터미널에 아래 비슷한 로그가 나오면 된다.
   - `Team Slack Bot started` 또는 포트·모드 안내
   - Socket Mode 사용 시: `Now connected to Slack` (또는 socket-mode 연결 로그)

6. **Slack에서 확인** — 봇을 초대한 채널에서 `/help` 또는 멘션으로 테스트.

---

## 자주 있는 일

| 상황 | 할 일 |
|------|--------|
| `Cannot find module` | 프로젝트 루트인지 확인 후 `npm install` |
| `invalid_auth` / 연결 실패 | `.env`의 `xoxb` 토큰이 최신인지, 앱 **재설치** 후 토큰 갱신 여부 확인 |
| 슬래시 명령이 “유효하지 않음” | [슬래시 커맨드 등록 가이드](./slack-slash-commands-setup.md)대로 앱에 등록·재설치 |
| DB 오류 | `DB_PATH` 폴더 쓰기 권한, `data/` 경로 확인 |

---

## 종료 방법

- 터미널에서 **`Ctrl + C`** 로 `nodemon`/`node` 프로세스를 끈다.  
- PC를 끄면 자동으로 종료되므로, **다음날은 위 “실행 순서”부터 다시** 하면 된다.

---

## 참고

- 프로덕션 배포(24시간 가동)는 별도 호스팅이 필요하다 — [`runtime-and-database-deployment.md`](./runtime-and-database-deployment.md)
