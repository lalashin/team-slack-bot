# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project**: Team Slack Bot  
**Type**: Dynamic (Node.js + Slack SDK)  
**Level**: Fullstack Web Application  
**Status**: Planning Phase (PDCA Plan Complete)

---

## Development Rules

### 1. Project Initialization Rule

**When starting a new project, always create README.md first.**

**Why**: README.md is the entry point for understanding the project. It should be created at the project start to establish clear communication about the project's purpose, features, and setup process.

**How to apply**: Before any other code or documentation work, ensure README.md exists with the following structure.

### 2. README.md Structure

Every README.md must contain these sections in this order:

```markdown
# 프로젝트명
## 개요
## 주요기능
## 기술스택
## 설치방법
```

**Detailed breakdown**:

1. **프로젝트명** (Project Name)
   - Clear, descriptive title
   - Use Korean naming convention

2. **개요** (Overview)
   - 1-2 paragraph project description
   - Target users and main use cases
   - Business value

3. **주요기능** (Key Features)
   - Bulleted list of main features
   - Brief description of each feature
   - Use cases or examples

4. **기술스택** (Tech Stack)
   - Runtime environment (e.g., Node.js 18+)
   - Framework/Libraries (e.g., Express.js, @slack/bolt)
   - Database (if applicable)
   - Deployment platform
   - Format as a simple list or table

5. **설치방법** (Installation)
   - Prerequisites (Node.js version, etc.)
   - Clone/setup instructions
   - Environment variable setup (.env example)
   - Dependency installation command
   - How to run the project (dev/production)

---

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js (or Hono)
- **Slack SDK**: @slack/bolt (official SDK)
- **Package Manager**: npm or yarn
- **Database**: (TBD) SQLite / PostgreSQL
- **Deployment**: Heroku / AWS / DigitalOcean

---

## Project Structure

```
team-slack-bot/
├── docs/                    # PDCA documentation
│   ├── 01-plan/            # Plan phase documents
│   ├── 02-design/          # Design phase documents
│   ├── 03-analysis/        # Gap analysis reports
│   └── 04-report/          # Completion reports
├── src/                     # Source code
│   ├── app.js              # Main Slack bot application
│   ├── handlers/           # Command and event handlers
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── tests/                   # Test files
├── .env.example            # Environment variables template
├── package.json            # Node.js dependencies
├── README.md               # Project documentation
└── CLAUDE.md               # This file
```

---

## Common Development Commands

### Setup & Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Slack bot token and signing secret
```

### Development

```bash
# Run in development mode (with auto-reload)
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## PDCA Workflow

This project follows the **PDCA (Plan-Design-Do-Check-Act) methodology**:

1. **Plan** (`/pdca plan team-slack-bot`)
   - Feature planning and requirements
   - Output: `docs/01-plan/features/team-slack-bot.plan.md`

2. **Design** (`/pdca design team-slack-bot`)
   - Architecture and technical design
   - Output: `docs/02-design/features/team-slack-bot.design.md`

3. **Do** (Implementation)
   - Write code based on design
   - Follow coding conventions

4. **Check** (`/pdca analyze team-slack-bot`)
   - Gap analysis: compare design vs implementation
   - Output: `docs/03-analysis/team-slack-bot.analysis.md`

5. **Act** (`/pdca iterate team-slack-bot`)
   - Auto-improvement if Match Rate < 90%
   - Continue until Match Rate >= 90%

6. **Report** (`/pdca report team-slack-bot`)
   - Final completion report
   - Output: `docs/04-report/team-slack-bot.report.md`

---

## Slack Bot Development Guidelines

### Key Files

- **`src/app.js`**: Main bot entry point, Slack app initialization
- **`src/handlers/commands.js`**: Slash command handlers (e.g., `/todo`, `/list`)
- **`src/handlers/events.js`**: Event listeners (reactions, messages)
- **`src/utils/`**: Helper functions for common operations

### Slack Token Management

⚠️ **SECURITY**: Never commit Slack tokens to git.

- Store tokens in `.env` file (not committed)
- Use environment variables: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`
- Rotate tokens regularly
- Use `.env.example` as a template

### Testing Slack Bot

- Use Slack's test workspace
- Test commands in a private channel first
- Monitor bot logs during development
- Use Slack API documentation for event payloads

---

## Code Conventions

### Naming
- **Files**: lowercase with hyphens (e.g., `message-handler.js`)
- **Functions**: camelCase (e.g., `handleSlashCommand()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SLACK_API_URL`)

### Error Handling
- Always catch promise rejections
- Log errors with context
- Return user-friendly error messages to Slack

### Comments
- Add comments only where logic is not self-evident
- Use JSDoc for function signatures

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Slack token stored securely
- [ ] Error logging enabled
- [ ] Rate limiting handled
- [ ] Documentation updated
- [ ] PDCA Check phase >= 90% Match Rate

---

## Useful Resources

- [Slack Bolt for JavaScript](https://slack.dev/bolt-js/)
- [Slack API Documentation](https://api.slack.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)
- [Project PDCA Documents](./docs/)

---

**Last Updated**: 2026-04-09  
**Maintainer**: Team
