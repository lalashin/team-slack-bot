require('dotenv').config();

/** App-Level Token (xapp-). Set to use Socket Mode (good for local dev without ngrok). */
const appToken = process.env.SLACK_APP_TOKEN || '';
const useSocketMode = Boolean(appToken);

module.exports = {
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken,
  useSocketMode,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/slack-bot.db',
};
