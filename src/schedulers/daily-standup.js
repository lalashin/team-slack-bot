const cron = require('node-cron');

function setupDailyStandup(app) {
  // 테스트용: 봇 시작 시 즉시 알림
  const channelId = process.env.NOTIFICATION_CHANNEL_ID;

  if (!channelId) {
    console.warn('⚠️  NOTIFICATION_CHANNEL_ID 환경변수가 설정되지 않았습니다.');
    return;
  }

  // 봇 시작 알림
  app.client.chat.postMessage({
    channel: channelId,
    text: '✅ 슬랙봇이 시작되었습니다!',
  }).then(() => {
    console.log('✅ 시작 알림 전송 완료');
  }).catch((error) => {
    console.error('❌ 시작 알림 전송 실패:', error);
  });

  // 매일 오전 9시 알림 (한국 시간 기준)
  cron.schedule('0 9 * * *', async () => {
    try {
      await app.client.chat.postMessage({
        channel: channelId,
        text: '🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요.',
      });
      console.log('✅ Daily Standup 알림 전송 완료');
    } catch (error) {
      console.error('❌ Daily Standup 알림 전송 실패:', error);
    }
  }, {
    timezone: 'Asia/Seoul',
  });

  console.log('⏰ Daily Standup 스케줄러 시작 (매일 오전 9시)');
}

module.exports = { setupDailyStandup };
