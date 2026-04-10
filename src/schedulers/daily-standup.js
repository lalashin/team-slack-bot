const cron = require('node-cron');
const logger = require('../logger');
const { SLACK_RETRY } = require('../constants/security');

const scheduledJobs = [];

/** 보고서 항목 9 — Slack API 일시 오류 재시도 (2026-04-10) */
function isRetryableSlackError(error) {
  if (!error) return false;
  const { code, data } = error;
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT') return true;
  if (data?.error === 'rate_limited') return true;
  if (typeof error.message === 'string' && /timeout/i.test(error.message)) return true;
  return false;
}

async function sendMessageWithRetry(client, params, retries = 0) {
  try {
    return await client.chat.postMessage(params);
  } catch (error) {
    if (retries < SLACK_RETRY.maxRetries && isRetryableSlackError(error)) {
      logger.warn({ err: error, retries }, 'Retrying Slack chat.postMessage');
      await new Promise((r) => {
        setTimeout(r, SLACK_RETRY.delayMs);
      });
      return sendMessageWithRetry(client, params, retries + 1);
    }
    throw error;
  }
}

function setupDailyStandup(app) {
  const channelId = (process.env.SLACK_NOTIFICATION_CHANNEL || '').trim();

  if (!channelId) {
    logger.warn(
      'SLACK_NOTIFICATION_CHANNEL is unset; skipping startup notification and daily standup cron (set it in .env to enable)',
    );
    return;
  }

  // 보고서 항목 10 — async/await로 시작 알림 (2026-04-10)
  void (async () => {
    try {
      await sendMessageWithRetry(app.client, {
        channel: channelId,
        text: '✅ 슬랙봇이 시작되었습니다!',
      });
      logger.info('Slack bot startup notification sent');
    } catch (error) {
      logger.error({ error }, 'Failed to send startup notification');
    }
  })();

  const tasks = [
    {
      cron: '0 9 * * *',
      startMsg: 'Daily standup scheduler started (9:00 AM KST daily)',
      run: async () => {
        await sendMessageWithRetry(app.client, {
          channel: channelId,
          text: '🌅 Daily Standup 시간입니다! 오늘 할 일을 공유해주세요.',
        });
        logger.info('Daily standup notification sent');
      },
      onErrorLabel: 'Failed to send daily standup notification',
    },
    {
      // 매일 17:45 KST — 금일 업무 회의록 업로드 알림
      cron: '45 17 * * *',
      startMsg: 'Meeting minutes reminder scheduler started (5:45 PM KST daily)',
      run: async () => {
        await sendMessageWithRetry(app.client, {
          channel: channelId,
          text: '📝 금일 업무 회의록을 이 채널에 올려 주세요.',
        });
        logger.info('Meeting minutes reminder sent');
      },
      onErrorLabel: 'Failed to send meeting minutes reminder',
    },
  ];

  for (const task of tasks) {
    try {
      const job = cron.schedule(
        task.cron,
        async () => {
          try {
            await task.run();
          } catch (error) {
            logger.error({ error }, task.onErrorLabel);
          }
        },
        { timezone: 'Asia/Seoul' },
      );
      scheduledJobs.push(job);
      logger.info(task.startMsg);
    } catch (error) {
      logger.error({ error, cron: task.cron }, 'Invalid cron schedule or timezone');
      throw error;
    }
  }
}

function stopSchedulers() {
  scheduledJobs.forEach((j) => {
    j.stop();
  });
  logger.info({ count: scheduledJobs.length }, 'All scheduled jobs stopped');
}

module.exports = { setupDailyStandup, stopSchedulers };
