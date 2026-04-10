const config = require('./config/slack');
const { initializeDatabase } = require('./db/init');
const { createApp } = require('./app');
const { setupDailyStandup, stopSchedulers } = require('./schedulers/daily-standup');
const logger = require('./logger');

let app = null;

async function main() {
  await initializeDatabase();
  app = createApp();
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
  if (app) {
    app.stop().then(() => process.exit(1)).catch(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown 핸들러
async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');

  // 스케줄러 정리
  try {
    stopSchedulers();
  } catch (error) {
    logger.error({ error }, 'Error stopping schedulers');
  }

  // Slack 앱 종료
  if (app) {
    try {
      await app.stop();
      logger.info('Slack app stopped successfully');
    } catch (error) {
      logger.error({ error }, 'Error stopping Slack app');
    }
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
