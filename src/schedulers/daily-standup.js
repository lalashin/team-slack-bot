const cron = require('node-cron');
const logger = require('../logger');

function setupDailyStandup(app) {
  const channelId = process.env.NOTIFICATION_CHANNEL_ID;

  if (!channelId) {
    logger.warn('NOTIFICATION_CHANNEL_ID 환경변수가 설정되지 않았습니다.');
    return;
  }

  // 봇 시작 알림
  app.client.chat.postMessage({
    channel: channelId,
    text: '✅ 슬랙봇이 시작되었습니다!',
  }).then(() => {
    logger.info('Slack bot startup notification sent');
  }).catch((error) => {
    logger.error({ error }, 'Failed to send startup notification');
  });

  // 매일 오전 9시 알림 (한국 시간 기준)
  cron.schedule('0 9 * * *', async () => {
    try {
      await app.client.chat.postMessage({
        channel: channelId,
        text: '🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요.',
      });
      logger.info('Daily standup notification sent');
    } catch (error) {
      logger.error({ error }, 'Failed to send daily standup notification');
    }
  }, {
    timezone: 'Asia/Seoul',
  });

  logger.info('Daily standup scheduler started (9:00 AM KST daily)');
}

module.exports = { setupDailyStandup };
