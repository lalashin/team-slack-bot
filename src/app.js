const { App } = require('@slack/bolt');
const config = require('./config/slack');
const { registerHandlers } = require('./handlers');
const logger = require('./logger');

function createApp() {
  const options = {
    token: config.botToken,
    signingSecret: config.signingSecret,
  };

  if (config.useSocketMode && config.appToken) {
    options.socketMode = true;
    options.appToken = config.appToken;
  }

  const app = new App(options);

  // Socket Mode 에러 핸들링
  if (config.useSocketMode) {
    // client 이벤트 리스너 설정 (소켓 모드 특정 에러 처리)
    app.client.on?.('error', (error) => {
      logger.error({ error }, 'Socket Mode client error');
    });

    // ready 이벤트: 연결 성공
    app.client.on?.('ready', () => {
      logger.info('Socket Mode connection established');
    });

    // disconnected 이벤트: 명시적 또는 비정상 종료
    app.client.on?.('disconnected', (reason) => {
      logger.warn({ reason }, 'Socket Mode disconnected');
    });

    // close 이벤트: 소켓 연결 종료
    app.client.on?.('close', (code, reason) => {
      logger.info({ code, reason }, 'Socket Mode connection closed');
    });
  }

  registerHandlers(app);
  return app;
}

module.exports = {
  createApp,
};
