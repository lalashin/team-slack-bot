/** Shared Korean help text (slash commands + mention). */

function getHelpBlocksKo() {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*📚 Team Slack Bot 도움말*\n\n' +
          '*슬래시 커맨드*는 입력창에 `/`만 치고 목록에서 고르거나, `/help`처럼 직접 입력해 주세요. (`@봇 /help` 일반 메시지는 슬랙이 명령으로 처리하지 않을 수 있어요.)\n\n' +
          '*명령어*:\n' +
          '• `/todo 작업 제목` — 작업 추가\n' +
          '• `/list` — 작업 목록\n' +
          '• `/list done` — 완료된 작업만\n' +
          '• `/status` — 봇 상태\n' +
          '• `/help` — 이 도움말\n\n' +
          '멘션만 주시면 안내 메시지를 보내요. 한글로 물어도 됩니다.',
      },
    },
  ];
}

module.exports = {
  getHelpBlocksKo,
};
