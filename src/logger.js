const pino = require('pino');
const { VALID_LOG_LEVELS } = require('./constants/security');

const envLevel = process.env.LOG_LEVEL;
// 보고서 항목 8 — LOG_LEVEL 유효성 (2026-04-10)
if (envLevel && !VALID_LOG_LEVELS.includes(envLevel)) {
  // eslint-disable-next-line no-console
  console.warn(`Invalid LOG_LEVEL "${envLevel}". Using fallback.`);
}

const level =
  envLevel && VALID_LOG_LEVELS.includes(envLevel)
    ? envLevel
    : process.env.NODE_ENV === 'production'
      ? 'info'
      : 'debug';

module.exports = pino({ level });
