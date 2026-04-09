# Do Phase: Team Slack Bot 구현 가이드

## 📋 Implementation Checklist

이 문서는 Design 문서의 "구현 순서"를 기반으로 한 상세 가이드입니다.

---

## Phase 1: Project Setup (Week 1)

### 1.1 Git 저장소 초기화
```bash
# 이미 git 저장소인 경우 스킵
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 1.2 package.json 생성 및 의존성 설치

**1단계**: package.json 생성
```bash
npm init -y
```

**2단계**: 필수 의존성 설치
```bash
npm install \
  @slack/bolt \
  express \
  sqlite3 \
  dotenv
```

**3단계**: 개발 의존성 설치
```bash
npm install --save-dev \
  nodemon \
  jest \
  eslint
```

**4단계**: package.json 스크립트 수정
```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest",
    "lint": "eslint src"
  }
}
```

### 1.3 환경변수 설정

**1단계**: `.env.example` 파일 생성
```env
# Slack 설정
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스
DB_PATH=./data/slack-bot.db
```

**2단계**: `.env` 파일 생성 (git에 커밋하지 않음)
```bash
cp .env.example .env
# .env 파일에 실제 토큰 입력
```

**3단계**: `.gitignore` 생성
```
node_modules/
.env
.env.local
.DS_Store
data/
*.db
npm-debug.log*
```

### 1.4 디렉토리 구조 생성
```bash
mkdir -p src/handlers
mkdir -p src/services
mkdir -p src/config
mkdir -p src/db
mkdir -p tests
mkdir -p data
```

**디렉토리 구조**:
```
team-slack-bot/
├── src/
│   ├── app.js                 # 메인 앱
│   ├── config/
│   │   └── slack.js           # Slack 설정
│   ├── handlers/
│   │   ├── commands.js        # 명령어 핸들러
│   │   └── events.js          # 이벤트 핸들러
│   ├── services/
│   │   └── dataService.js     # 데이터 서비스
│   └── db/
│       └── init.js            # DB 초기화
├── tests/
│   └── app.test.js
├── data/                      # SQLite DB 파일 위치
├── docs/                      # PDCA 문서
├── .env.example
├── .env                       # git 무시
├── .gitignore
├── package.json
├── README.md
├── CLAUDE.md
└── BKIT_명령어_가이드.txt
```

### 1.5 README.md 생성

**중요**: 프로젝트 시작 시 README.md를 먼저 생성해야 합니다 (CLAUDE.md 규칙 참고)

```markdown
# Team Slack Bot

팀의 Slack 채널에서 작업을 효율적으로 관리하는 자동화 봇입니다.

## 개요

팀원들이 Slack에서 직접 명령어를 통해 업무를 관리하고, 봇이 자동으로 작업 추적과 알림을 수행합니다.

## 주요기능

- `/todo` - 작업 추가
- `/list` - 작업 목록 조회
- `/status` - 봇 상태 확인
- `/help` - 도움말 표시
- 메시지 반응으로 작업 상태 변경

## 기술스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Slack SDK**: @slack/bolt
- **Database**: SQLite3
- **Package Manager**: npm

## 설치방법

### 사전 조건
- Node.js 18 이상
- npm 또는 yarn
- Slack 워크스페이스 관리자 권한
- Slack App 토큰

### 설치 단계

1. 저장소 클론
```bash
git clone <repository-url>
cd team-slack-bot
```

2. 의존성 설치
```bash
npm install
```

3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에 Slack 토큰 입력
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 프로덕션 서버 실행
```bash
npm start
```

## 사용방법

### 기본 명령어

```
/todo "작업명"     - 새로운 작업 추가
/list              - 현재 작업 목록 조회
/list done         - 완료된 작업 조회
/status            - 봇 상태 확인
/help              - 도움말 표시
```

### 반응으로 상태 변경

메시지에 반응(reaction)을 추가하면 작업 상태가 자동으로 변경됩니다.

## 구조

- `src/app.js` - 메인 애플리케이션 엔트리 포인트
- `src/handlers/` - 명령어 및 이벤트 핸들러
- `src/services/` - 비즈니스 로직 및 데이터 서비스
- `src/db/` - 데이터베이스 스키마 및 초기화

## 환경변수

```env
SLACK_BOT_TOKEN=xoxb-... # Slack Bot 토큰
SLACK_SIGNING_SECRET=... # Slack Signing Secret
PORT=3000                # 서버 포트
NODE_ENV=development     # 환경 (development/production)
DB_PATH=./data/slack-bot.db # 데이터베이스 경로
```

## 테스트

```bash
npm test
```

## 라이센스

MIT
```

---

## Phase 2: Core Bot Setup (Week 1-2)

### 2.1 Slack App 등록 및 토큰 받기

**1단계**: Slack App 생성
1. https://api.slack.com/apps 접속
2. "Create New App" 클릭
3. "From scratch" 선택
4. App 이름: "Team Slack Bot"
5. Workspace 선택

**2단계**: 권한 설정
1. "OAuth & Permissions" → "Scopes"
2. **Bot Token Scopes** 추가:
   - `chat:write` - 메시지 전송
   - `commands` - 슬래시 명령어
   - `app_mentions:read` - 멘션 감지
   - `reactions:read` - 반응 감지

**3단계**: 토큰 복사
- "Bot User OAuth Token" 복사 → `.env`의 `SLACK_BOT_TOKEN`
- "Signing Secret" 복사 → `.env`의 `SLACK_SIGNING_SECRET`

**4단계**: 이벤트 구독 설정
1. "Event Subscriptions" 활성화
2. Request URL: `https://your-domain/slack/events` (배포 후)
3. Subscribe to bot events:
   - `app_mention`
   - `reaction_added`
   - `message`

**5단계**: 슬래시 명령어 등록
1. "Slash Commands" → "Create New Command"
2. 각 명령어 추가:
   - `/todo`
   - `/list`
   - `/status`
   - `/help`

### 2.2 기본 Bot Server 구현

**파일**: `src/config/slack.js`
```javascript
require('dotenv').config();

module.exports = {
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/slack-bot.db'
};
```

**파일**: `src/app.js` (메인 앱)
```javascript
const { App } = require('@slack/bolt');
const config = require('./config/slack');

const app = new App({
  token: config.botToken,
  signingSecret: config.signingSecret,
  socketMode: false,
  port: config.port
});

// 포트 리스닝
app.start(config.port, () => {
  console.log(`⚡️ Slack Bot server started on port ${config.port}`);
});

module.exports = app;
```

### 2.3 기본 이벤트 핸들러 등록

**파일**: `src/handlers/events.js`
```javascript
// 봇 멘션 감지
async function handleMention({ event, say }) {
  try {
    await say(`Hi <@${event.user}>! I'm Team Slack Bot. Type /help to see available commands.`);
  } catch (error) {
    console.error('Error handling mention:', error);
  }
}

module.exports = {
  handleMention
};
```

**파일**: `src/app.js` (이벤트 리스너 등록)
```javascript
const { handleMention } = require('./handlers/events');

// 이벤트 리스너 등록
app.event('app_mention', handleMention);
```

### 2.4 응답 형식 정의

**표준 응답 형식**:
```javascript
// 블록 형식으로 응답 (권장)
await respond({
  response_type: 'in_channel',  // 채널 공개 또는 'ephemeral' (개인)
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*✅ 작업이 추가되었습니다.*\n작업 ID: `task-123`'
      }
    }
  ]
});

// 텍스트 형식 (간단한 응답)
await respond({
  text: '✅ 작업이 추가되었습니다.'
});
```

---

## Phase 3: Command Implementation (Week 2)

### 3.1 명령어 핸들러 구현

**파일**: `src/handlers/commands.js`

```javascript
// 입력 검증 유틸리티
function validateInput(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: '작업명을 입력해주세요.' };
  }
  return { valid: true };
}

// /todo 명령어 처리
async function handleTodoCommand({ command, ack, respond }) {
  await ack();
  
  try {
    const { valid, error } = validateInput(command.text);
    
    if (!valid) {
      await respond({ text: `❌ 오류: ${error}` });
      return;
    }

    // TODO: 데이터베이스에 작업 저장
    const taskId = `task-${Date.now()}`;
    
    await respond({
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *작업이 추가되었습니다.*\n제목: ${command.text}\n작업 ID: \`${taskId}\``
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error in /todo command:', error);
    await respond({ text: '❌ 오류가 발생했습니다.' });
  }
}

// /list 명령어 처리
async function handleListCommand({ command, ack, respond }) {
  await ack();
  
  try {
    // TODO: 데이터베이스에서 작업 조회
    const tasks = [];
    
    if (tasks.length === 0) {
      await respond({ text: '📋 현재 작업이 없습니다.' });
      return;
    }

    const taskList = tasks
      .map((t, i) => `${i + 1}. ${t.title} (${t.status})`)
      .join('\n');

    await respond({
      text: `📋 *작업 목록*\n${taskList}`
    });
  } catch (error) {
    console.error('Error in /list command:', error);
    await respond({ text: '❌ 오류가 발생했습니다.' });
  }
}

// /status 명령어 처리
async function handleStatusCommand({ ack, respond }) {
  await ack();
  
  try {
    // TODO: 봇 상태 조회
    await respond({
      text: `✅ *Team Slack Bot is running*\n활성 작업: 0개`
    });
  } catch (error) {
    console.error('Error in /status command:', error);
    await respond({ text: '❌ 오류가 발생했습니다.' });
  }
}

// /help 명령어 처리
async function handleHelpCommand({ ack, respond }) {
  await ack();
  
  try {
    await respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📚 Team Slack Bot 도움말*\n\n*사용 가능한 명령어*:\n\`/todo "작업명"\` - 새로운 작업 추가\n\`/list\` - 작업 목록 조회\n\`/list done\` - 완료된 작업 조회\n\`/status\` - 봇 상태 확인\n\`/help\` - 도움말 표시`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error in /help command:', error);
    await respond({ text: '❌ 오류가 발생했습니다.' });
  }
}

module.exports = {
  handleTodoCommand,
  handleListCommand,
  handleStatusCommand,
  handleHelpCommand
};
```

### 3.2 앱에 명령어 등록

**파일**: `src/app.js` (수정)
```javascript
const { App } = require('@slack/bolt');
const config = require('./config/slack');
const {
  handleTodoCommand,
  handleListCommand,
  handleStatusCommand,
  handleHelpCommand
} = require('./handlers/commands');
const { handleMention } = require('./handlers/events');

const app = new App({
  token: config.botToken,
  signingSecret: config.signingSecret,
  socketMode: false,
  port: config.port
});

// 명령어 등록
app.command('/todo', handleTodoCommand);
app.command('/list', handleListCommand);
app.command('/status', handleStatusCommand);
app.command('/help', handleHelpCommand);

// 이벤트 등록
app.event('app_mention', handleMention);

// 포트 리스닝
app.start(config.port, () => {
  console.log(`⚡️ Slack Bot server started on port ${config.port}`);
});

module.exports = app;
```

### 3.3 입력 검증 유틸리티

**파일**: `src/utils/validators.js`
```javascript
function isValidTaskTitle(title) {
  return title && title.trim().length > 0 && title.trim().length <= 200;
}

function isValidTaskStatus(status) {
  const validStatuses = ['open', 'in_progress', 'done'];
  return validStatuses.includes(status);
}

module.exports = {
  isValidTaskTitle,
  isValidTaskStatus
};
```

---

## Phase 4: Data Storage (Week 2-3)

### 4.1 SQLite 초기화

**파일**: `src/db/init.js`
```javascript
const sqlite3 = require('sqlite3').verbose();
const config = require('../config/slack');
const fs = require('fs');
const path = require('path');

// 데이터 디렉토리 생성
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(config.dbPath);

// 스키마 생성
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // tasks 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP
        )
      `);

      // users 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          slack_id TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          display_name TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // events_log 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS events_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          user_id TEXT,
          task_id TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  });
}

module.exports = { db, initializeDatabase };
```

### 4.2 Data Service 구현

**파일**: `src/services/dataService.js`
```javascript
const { db } = require('../db/init');

// 작업 생성
function createTask(userId, title, description = '') {
  return new Promise((resolve, reject) => {
    const taskId = `task-${Date.now()}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO tasks (id, user_id, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, userId, title, description, now, now],
      function(err) {
        if (err) reject(err);
        else resolve({ id: taskId, userId, title, description });
      }
    );
  });
}

// 작업 조회
function getTask(taskId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// 작업 목록 조회
function listTasks(filters = {}) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// 작업 업데이트
function updateTask(taskId, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(taskId);

    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) reject(err);
      else resolve({ id: taskId, ...updates });
    });
  });
}

// 작업 삭제
function deleteTask(taskId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
      if (err) reject(err);
      else resolve({ id: taskId });
    });
  });
}

module.exports = {
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask
};
```

### 4.3 app.js에 데이터 서비스 통합

**파일**: `src/app.js` (수정)
```javascript
const { initializeDatabase } = require('./db/init');
const dataService = require('./services/dataService');

// 앱 시작 전 데이터베이스 초기화
(async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
})();

// 명령어에 데이터 서비스 통합
app.command('/todo', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const task = await dataService.createTask(command.user_id, command.text);
    
    await respond({
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *작업이 추가되었습니다.*\n제목: ${task.title}\n작업 ID: \`${task.id}\``
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error creating task:', error);
    await respond({ text: '❌ 오류가 발생했습니다.' });
  }
});
```

---

## Phase 5: Event Handling (Week 3)

### 5.1 반응 이벤트 핸들러

**파일**: `src/handlers/events.js` (확장)
```javascript
const dataService = require('../services/dataService');

// 반응 추가 감지
async function handleReactionAdded({ event, client }) {
  try {
    const { user, reaction, item } = event;
    
    // 작업 ID가 메시지에 있는 경우만 처리
    if (item.type === 'message') {
      // 메시지 조회
      const message = await client.conversations.history({
        channel: item.channel,
        latest: item.ts,
        limit: 1,
        inclusive: true
      });

      const messageText = message.messages[0].text || '';
      
      // 작업 ID 추출 (예: task-123)
      const taskIdMatch = messageText.match(/task-\d+/);
      
      if (taskIdMatch) {
        const taskId = taskIdMatch[0];
        
        // 반응에 따라 상태 변경
        let newStatus = 'open';
        if (reaction === 'white_check_mark' || reaction === 'heavy_check_mark') {
          newStatus = 'done';
        } else if (reaction === 'hourglass_flowing_sand') {
          newStatus = 'in_progress';
        }

        await dataService.updateTask(taskId, { status: newStatus });
      }
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
  }
}

module.exports = {
  handleMention,
  handleReactionAdded
};
```

### 5.2 앱에 이벤트 등록

**파일**: `src/app.js` (수정)
```javascript
const { handleMention, handleReactionAdded } = require('./handlers/events');

// 이벤트 등록
app.event('app_mention', handleMention);
app.event('reaction_added', handleReactionAdded);
```

---

## Phase 6: Testing & Polish (Week 3-4)

### 6.1 기본 테스트 작성

**파일**: `tests/app.test.js`
```javascript
describe('Team Slack Bot', () => {
  describe('/todo command', () => {
    test('should create a task', async () => {
      // TODO: 테스트 코드 작성
    });
  });

  describe('/list command', () => {
    test('should list all tasks', async () => {
      // TODO: 테스트 코드 작성
    });
  });
});
```

### 6.2 에러 처리 개선

모든 핸들러에 try-catch 추가 (위의 코드 참고)

### 6.3 로깅 추가

```javascript
console.error('Error:', error);     // 에러 로그
console.log('Task created:', task); // 일반 로그
```

---

## Phase 7: Deployment (Week 4)

### 7.1 배포 환경 확인

```bash
# 프로덕션 환경 변수 확인
npm run build  # 필요 시
npm start      # 프로덕션 서버 시작
```

### 7.2 배포 옵션

1. **Heroku** (권장)
   ```bash
   heroku create
   git push heroku main
   ```

2. **AWS/DigitalOcean**
   - 서버 설정 필요

---

## 🎯 구현 체크리스트

### ✅ 완료
- [x] Plan 문서 작성
- [x] Design 문서 작성
- [x] Do phase 가이드 작성

### ⏳ 진행 중
- [ ] Phase 1: 프로젝트 설정
  - [ ] package.json 생성
  - [ ] 의존성 설치
  - [ ] .env 설정
  - [ ] 디렉토리 구조 생성
  - [ ] README.md 작성

- [ ] Phase 2: Core Bot 설정
  - [ ] Slack App 등록
  - [ ] 토큰 받기
  - [ ] 권한 설정
  - [ ] src/app.js 작성
  - [ ] 기본 이벤트 핸들러

- [ ] Phase 3: 명령어 구현
  - [ ] /todo 명령어
  - [ ] /list 명령어
  - [ ] /status 명령어
  - [ ] /help 명령어

- [ ] Phase 4: 데이터 저장소
  - [ ] SQLite 초기화
  - [ ] Data Service 구현
  - [ ] CRUD 작업

- [ ] Phase 5: 이벤트 처리
  - [ ] reaction_added 이벤트
  - [ ] 상태 변경 로직

- [ ] Phase 6: 테스트 & 최적화
  - [ ] 단위 테스트 작성
  - [ ] 통합 테스트
  - [ ] 오류 처리 개선
  - [ ] 로깅 추가

- [ ] Phase 7: 배포
  - [ ] 배포 환경 설정
  - [ ] 최종 테스트

---

## 📞 트러블슈팅

### 토큰 관련 오류
```
Error: token_revoked
```
→ Slack App 설정에서 토큰 재발급

### 포트 이미 사용 중
```
Error: listen EADDRINUSE :::3000
```
→ `PORT=3001 npm run dev`로 다른 포트 사용

### 데이터베이스 오류
```
Error: database is locked
```
→ 다른 프로세스에서 DB를 사용 중. 재시작 필요

---

**이 가이드를 따라 단계별로 구현하면 Team Slack Bot의 기본 기능을 완성할 수 있습니다!** 🚀
