const express = require('express');
const { App, ExpressReceiver } = require('@slack/bolt');
const config = require('./config/slack');
const { registerHandlers } = require('./handlers');
const logger = require('./logger');
const { createHttpPayloadLimitMiddleware } = require('./middleware/httpPayloadLimit');

function createSocketModeApp() {
  // 보고서 항목 6 — 명시적 Socket Mode (app.js 6–17 대응, 2026-04-10)
  const options = {
    token: config.botToken,
    signingSecret: config.signingSecret,
    socketMode: true,
    appToken: config.appToken,
  };
  logger.info({ mode: 'socket' }, 'Creating Slack app');
  return new App(options);
}

function createHttpModeApp() {
  // 보고서 항목 5 — HTTP 요청 본문 크기 상한 (Content-Length), Bolt raw-body와 호환 (2026-04-10)
  const expressApp = express();
  expressApp.use(createHttpPayloadLimitMiddleware());

  const receiver = new ExpressReceiver({
    signingSecret: config.signingSecret,
    app: expressApp,
  });

  logger.info({ mode: 'http' }, 'Creating Slack app');
  return new App({
    token: config.botToken,
    receiver,
  });
}

function createApp() {
  const app = config.useSocketMode ? createSocketModeApp() : createHttpModeApp();

  if (config.useSocketMode && app.receiver) {
    const socketClient = app.receiver.client;

    if (socketClient) {
      socketClient.on('connected', () => {
        logger.info('Socket Mode connected successfully');
      });

      socketClient.on('disconnected', (reason) => {
        logger.warn({ reason }, 'Socket Mode disconnected');
      });

      socketClient.on('error', (error) => {
        logger.error({ error }, 'Socket Mode error');
      });

      socketClient.on('close', () => {
        logger.info('Socket Mode connection closed');
      });
    }
  }

  app.error(async (error) => {
    logger.error({ error }, 'Bolt app-level error');
  });

  registerHandlers(app);
  return app;
}

module.exports = {
  createApp,
};
