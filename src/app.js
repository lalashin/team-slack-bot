const { App } = require('@slack/bolt');
const config = require('./config/slack');
const { registerHandlers } = require('./handlers');

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

  registerHandlers(app);
  return app;
}

module.exports = {
  createApp,
};
