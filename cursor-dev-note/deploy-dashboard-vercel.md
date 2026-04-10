# 대시보드 배포 가이드 (Vercel · 현재 목업 기준)

이 레포는 **모노레포 형태**입니다. Slack 봇은 Node(루트 `package.json`), 대시보드는 **`dashboard/`** 아래 Next.js 앱입니다. **지금 단계**에서는 대시보드만 Vercel에 올려 **URL로 UI를 보여주는 것**을 목표로 합니다(데이터는 목업).

---

## 사전 요건

- GitHub(또는 GitLab/Bitbucket)에 이 레포가 push 되어 있을 것.
- [Vercel](https://vercel.com) 계정 (GitHub 연동 권장).
- 로컬에서 `cd dashboard && npm run build` 가 성공할 것.

---

## 방법 A — Vercel 대시보드에서 연결 (권장)

1. Vercel에 로그인 → **Add New…** → **Project**.
2. 해당 Git 레포지토리 **Import**.
3. **Configure Project**에서 다음을 설정합니다.
   - **Root Directory** → **Edit** → `dashboard` 선택  
     (이 단계가 빠지면 루트에 Next가 없어 빌드가 실패합니다.)
   - **Framework Preset:** Next.js (자동 인식)
   - **Build Command:** `npm run build` (기본값 유지)
   - **Output Directory:** 비워 둠 (Next 기본)
   - **Install Command:** `npm install` (기본값)
4. **Environment Variables**  
   - 현재 목업만 쓴다면 **필수는 없음**.  
   - 나중에 API를 붙일 때: `NEXT_PUBLIC_API_BASE_URL` = 봇 서버 URL.
5. **Deploy** 클릭.

배포가 끝나면 `*.vercel.app` 주소가 생성됩니다. **Production** URL을 강의·자료에 넣으면 됩니다.

---

## 방법 B — Vercel CLI (로컬)

```bash
cd dashboard
npm install
npx vercel login
npx vercel        # 프리뷰
npx vercel --prod # 프로덕션
```

처음 실행 시 프로젝트·팀을 물어보면 안내에 따라 선택합니다. **Root가 `dashboard`인 프로젝트**로 연결되었는지 확인하세요.

---

## 트러블슈팅

| 증상 | 조치 |
|------|------|
| Build failed: No Next.js | **Root Directory**가 `dashboard`인지 확인 |
| 구버전 Node | Vercel Project → Settings → Node.js Version → **20.x** 권장 |
| 이전에 보던 `Cannot find module './xxx.js'` | 로컬/CI에서 `dashboard/.next` 삭제 후 재빌드 |

---

## 봇 서버와 한 도메인에 묶기 (나중에)

- 봇 API가 생기면 **Vercel rewrites** 또는 **별도 리버스 프록시**로 `/api`를 봇 서버에 넘기는 방식을 검토합니다. 자세한 것은 `remaining-work-dashboard-and-bot.md` Phase B 참고.

---

## 관련 파일

- `dashboard/vercel.json` — Vercel이 Next를 인식할 때 참고하는 메타(선택)
- `dashboard/package.json` — `engines.node`로 런타임 힌트
