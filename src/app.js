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
  if (config.useSocketMode && app.receiver) {
    // SocketModeReceiver의 클라이언트에서 실제 이벤트 발생
    const socketClient = app.receiver.client;

    if (socketClient) {
      // 연결 성공
      socketClient.on('connected', () => {
        logger.info('Socket Mode connected successfully');
      });

      // 명시적 또는 비정상 종료
      socketClient.on('disconnected', (reason) => {
        logger.warn({ reason }, 'Socket Mode disconnected');
      });

      // 에러 처리
      socketClient.on('error', (error) => {
        logger.error({ error }, 'Socket Mode error');
      });

      // 연결 종료
      socketClient.on('close', () => {
        logger.info('Socket Mode connection closed');
      });
    }
  }

  // Bolt 앱 레벨 에러 핸들러 (추가 방어)
  app.error(async (error) => {
    logger.error({ error }, 'Bolt app-level error');
  });

  registerHandlers(app);
  return app;
}

module.exports = {
  createApp,
};
