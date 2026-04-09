const dataService = require('../services/dataService');
const { getHelpBlocksKo } = require('../messages/help');
const logger = require('../logger');
const { isValidTaskTitle } = require('../utils/validators');

async function handleTodoCommand({ command, ack, respond }) {
  await ack();

  try {
    const text = (command.text || '').trim();
    if (!isValidTaskTitle(text)) {
      await respond({ text: '❌ 오류: 작업명을 입력해주세요. (최대 200자)' });
      return;
    }

    const task = await dataService.createTask(command.user_id, text);

    await dataService.logEvent('command_todo', {
      userId: command.user_id,
      taskId: task.id,
      metadata: { title: text, channel: command.channel_id },
    });

    await respond({
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *작업이 추가되었습니다.*\n제목: ${text}\n작업 ID: \`${task.id}\``,
          },
        },
      ],
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /todo command');
    await respond({ text: '❌ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

async function handleListCommand({ command, ack, respond }) {
  await ack();

  try {
    const arg = (command.text || '').trim().toLowerCase();
    const filters = {};
    if (arg === 'done' || arg === 'open' || arg === 'in_progress') {
      filters.status = arg;
    }

    const tasks = await dataService.listTasks(filters);

    await dataService.logEvent('command_list', {
      userId: command.user_id,
      metadata: { filter: arg || 'all', resultCount: tasks.length },
    });

    if (tasks.length === 0) {
      await respond({ text: '📋 현재 작업이 없습니다.' });
      return;
    }

    const taskList = tasks
      .map((t, i) => `${i + 1}. ${t.title} (\`${t.status}\`) — \`${t.id}\``)
      .join('\n');

    await respond({
      text: `📋 *작업 목록*\n${taskList}`,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /list command');
    await respond({ text: '❌ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

async function handleStatusCommand({ command, ack, respond }) {
  await ack();

  try {
    const count = await dataService.getActiveTaskCount();

    await dataService.logEvent('command_status', {
      userId: command.user_id,
      metadata: { taskCount: count },
    });

    await respond({
      text: `✅ *Team Slack Bot is running*\n저장된 작업: ${count}개 (SQLite)`,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /status command');
    await respond({ text: '❌ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

async function handleHelpCommand({ ack, respond }) {
  await ack();

  try {
    await respond({
      blocks: getHelpBlocksKo(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /help command');
    await respond({ text: '❌ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

module.exports = {
  handleTodoCommand,
  handleListCommand,
  handleStatusCommand,
  handleHelpCommand,
};
