/**
 * Centralized limits (보고서 §2026 개선안 "명시적 상수 및 설정 중앙화", 2026-04-10)
 */
const HTTP_PAYLOAD_MAX_BYTES = 1024 * 1024; // 1 MiB — 보고서 항목 5 (요청 페이로드 크기 제한)

/** Slash command task title max length — 보고서 항목 3 (2026-04-10) */
const MAX_TASK_TITLE_LENGTH = 200;

const SLACK_RETRY = Object.freeze({
  maxRetries: 3,
  delayMs: 5000,
});

const VALID_LOG_LEVELS = Object.freeze(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);

module.exports = {
  HTTP_PAYLOAD_MAX_BYTES,
  MAX_TASK_TITLE_LENGTH,
  SLACK_RETRY,
  VALID_LOG_LEVELS,
};
