const config = require('./config/slack');
const { initializeDatabase } = require('./db/init');
const { createApp } = require('./app');
const { setupDailyStandup } = require('./schedulers/daily-standup');
const logger = require('./logger');

async function main() {
  await initializeDatabase();
  const app = createApp();
  // 알림 스케줄러 시작
  setupDailyStandup(app);
  await app.start(config.port);
  const mode = config.useSocketMode ? 'Socket Mode (local-friendly)' : 'HTTP';
  logger.info(
    { port: config.port, mode, dbPath: config.dbPath },
    'Team Slack Bot started',
  );
}

// 글로벌 에러 핸들링: 처리되지 않은 Promise 거부
process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { reason, promise },
    'Unhandled Rejection at promise',
  );
});

// 글로벌 에러 핸들링: 처리되지 않은 예외
process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception thrown');
  process.exit(1);
});

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
