const { getHelpBlocksKo } = require('../messages/help');
const dataService = require('../services/dataService');
const logger = require('../logger');

function stripMentionText(text) {
  return (text || '').replace(/<@[^>]+>/g, '').trim();
}

function wantsHelp(text) {
  const body = stripMentionText(text).toLowerCase();
  if (!body) return false;
  if (/\/?help\b/i.test(body)) return true;
  if (/^도움말?$/.test(body)) return true;
  if (body.startsWith('도움')) return true;
  return false;
}

async function handleMention({ event, say }) {
  try {
    await dataService.logEvent('app_mention', {
      userId: event.user,
      metadata: { channel: event.channel, text: (event.text || '').slice(0, 200) },
    });

    if (wantsHelp(event.text)) {
      await say({ blocks: getHelpBlocksKo() });
      return;
    }

    const body = stripMentionText(event.text);
    if (!body) {
      await say({
        text:
          `<@${event.user}>님, 안녕하세요. \`/help\`를 입력창에 입력하거나, 멘션과 함께 \`도움\`이라고 보내 주세요. 한글로 물어도 됩니다.`,
      });
      return;
    }

    await say({
      text:
        `<@${event.user}>님, 메시지 받았어요. 할 일은 \`/todo 제목\`, 목록은 \`/list\`, 상태는 \`/status\`, 도움말은 \`/help\`(또는 멘션 + \`도움\`)을 써 주세요.`,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error handling mention');
  }
}

/**
 * DM with the bot — Slack does NOT send `app_mention` here; use `message` + `message.im` subscription.
 */
async function handleDirectMessage({ event, say }) {
  try {
    if (event.bot_id) return;
    if (event.subtype && !['file_share', 'file_comment'].includes(event.subtype)) return;
    if (!event.text || !event.text.trim()) return;

    const isIm =
      event.channel_type === 'im' ||
      (typeof event.channel === 'string' && event.channel.startsWith('D'));
    if (!isIm) return;

    if (wantsHelp(event.text)) {
      await say({ blocks: getHelpBlocksKo() });
      return;
    }

    await say({
      text:
        `<@${event.user}>님, DM에서도 동일해요. 입력창에 \`/help\`처럼 슬래시 명령을 쓰거나, 여기서 \`도움\`이라고 보내 보세요.`,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error handling DM');
  }
}

/** Slack reaction on a message — logs + marks task done if message was linked (slack_message_ts). */
async function handleReactionAdded({ event }) {
  try {
    if (event.item?.type !== 'message') return;

    await dataService.logEvent('reaction_added', {
      userId: event.user,
      metadata: {
        reaction: event.reaction,
        channel: event.item.channel,
        ts: event.item.ts,
      },
    });

    if (event.reaction === 'white_check_mark') {
      const updated = await dataService.markTaskDoneBySlackMessage({
        channel: event.item.channel,
        messageTs: event.item.ts,
      });
      if (updated > 0) {
        logger.info(
          { channel: event.item.channel, ts: event.item.ts },
          'Task marked done via reaction',
        );
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Error handling reaction_added');
  }
}

module.exports = {
  handleMention,
  handleDirectMessage,
  handleReactionAdded,
};
