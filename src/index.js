const config = require('./config/slack');
const { initializeDatabase } = require('./db/init');
const { createApp } = require('./app');
const { setupDailyStandup, stopSchedulers } = require('./schedulers/daily-standup');
const logger = require('./logger');

let app = null;

async function main() {
  await initializeDatabase();
  app = createApp();
  setupDailyStandup(app);
  await app.start(config.port);
  const mode = config.useSocketMode ? 'Socket Mode (local-friendly)' : 'HTTP';
  logger.info(
    { port: config.port, mode, dbPath: config.dbPath },
    'Team Slack Bot started',
  );
}

function serializeReason(reason) {
  if (reason instanceof Error) {
    return {
      message: reason.message,
      name: reason.name,
    };
  }
  return String(reason);
}

// 보고서 항목 4 — unhandledRejection 로그 최소화 (프로덕션에서 스택/프로미스 전체 미노출, 2026-04-10)
process.on('unhandledRejection', (reason) => {
  const isDev = process.env.NODE_ENV !== 'production';

  logger.error(
    {
      reason: reason instanceof Error
        ? {
            message: reason.message,
            name: reason.name,
            ...(isDev && { stack: reason.stack }),
          }
        : serializeReason(reason),
      promiseState: 'rejected',
    },
    'Unhandled Rejection',
  );
});

process.on('uncaughtException', (error) => {
  const isDev = process.env.NODE_ENV !== 'production';
  logger.error(
    {
      message: error.message,
      name: error.name,
      ...(isDev && { stack: error.stack }),
    },
    'Uncaught Exception thrown',
  );
  if (app) {
    app.stop().then(() => process.exit(1)).catch(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');

  try {
    stopSchedulers();
  } catch (error) {
    logger.error({ error }, 'Error stopping schedulers');
  }

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
