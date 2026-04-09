const config = require('./config/slack');
const { initializeDatabase } = require('./db/init');
const { createApp } = require('./app');
const logger = require('./logger');

async function main() {
  await initializeDatabase();
  const app = createApp();
  await app.start(config.port);
  const mode = config.useSocketMode ? 'Socket Mode (local-friendly)' : 'HTTP';
  logger.info(
    { port: config.port, mode, dbPath: config.dbPath },
    'Team Slack Bot started',
  );
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
