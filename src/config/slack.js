require('dotenv').config();

const REQUIRED_ENV = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'];

function assertRequiredEnv() {
  const missing = REQUIRED_ENV.filter((key) => {
    const v = process.env[key];
    return v === undefined || String(v).trim() === '';
  });
  if (missing.length > 0) {
    // 보고서 항목 1 — 환경변수 검증 (2026-04-10)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

assertRequiredEnv();

/** App-Level Token (xapp-). Set to use Socket Mode (good for local dev without ngrok). */
const appToken = (process.env.SLACK_APP_TOKEN || '').trim();

const socketModeExplicit = /^(1|true|yes)$/i.test(String(process.env.SLACK_USE_SOCKET_MODE || ''));
if (socketModeExplicit && !appToken) {
  // 보고서 항목 6 — Socket Mode / HTTP 모드 불일치 방지 (2026-04-10)
  throw new Error('Socket Mode requested (SLACK_USE_SOCKET_MODE) but SLACK_APP_TOKEN is missing');
}

const useSocketMode = Boolean(appToken);

const port = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isFinite(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT environment value: ${process.env.PORT}`);
}

module.exports = {
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken,
  useSocketMode,
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/slack-bot.db',
};
