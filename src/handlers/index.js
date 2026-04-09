const {
  handleTodoCommand,
  handleListCommand,
  handleStatusCommand,
  handleHelpCommand,
} = require('./commands');
const { handleMention, handleDirectMessage, handleReactionAdded } = require('./events');

function registerHandlers(app) {
  // Set LOG_SLACK_EVENTS=1 to see which events reach the bot (terminal).
  if (process.env.LOG_SLACK_EVENTS === '1') {
    app.use(async ({ body, next }) => {
      const ev = body?.event;
      if (ev?.type) {
        console.log('[slack event]', ev.type, ev.channel || ev.user || '');
      }
      await next();
    });
  }

  app.command('/todo', handleTodoCommand);
  app.command('/list', handleListCommand);
  app.command('/status', handleStatusCommand);
  app.command('/help', handleHelpCommand);

  app.event('app_mention', handleMention);
  app.event('message', handleDirectMessage);
  app.event('reaction_added', handleReactionAdded);
}

module.exports = {
  registerHandlers,
};
