const { MAX_TASK_TITLE_LENGTH } = require('../constants/security');

const INVISIBLE_BIDI_RE = /[\u200B-\u200D\u202A-\u202E\u061C\u2066-\u2069]/g;

/**
 * 보고서 항목 3 — 입력값 검증 강화 (2026-04-10)
 */
function isValidTaskTitle(title) {
  if (title === undefined || title === null || typeof title !== 'string') return false;

  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_TASK_TITLE_LENGTH) return false;

  const cleaned = trimmed.replace(INVISIBLE_BIDI_RE, '');
  return cleaned.length > 0;
}

function isValidTaskStatus(status) {
  const validStatuses = ['open', 'in_progress', 'done'];
  return validStatuses.includes(status);
}

/**
 * 보고서 항목 3·11 — Slack mrkdwn 특수문자 이스케이프 (2026-04-10)
 */
function escapeSlackMrkdwn(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>');
}

module.exports = {
  isValidTaskTitle,
  isValidTaskStatus,
  escapeSlackMrkdwn,
};
