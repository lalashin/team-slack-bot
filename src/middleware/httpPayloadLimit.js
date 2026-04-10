const { HTTP_PAYLOAD_MAX_BYTES } = require('../constants/security');

/**
 * Reject oversized bodies before the stream is fully buffered (보고서 항목 5, 2026-04-10).
 * Slack Bolt verifies signatures on raw bytes; we avoid replacing Bolt's body parser.
 */
function createHttpPayloadLimitMiddleware(maxBytes = HTTP_PAYLOAD_MAX_BYTES) {
  return function httpPayloadLimit(req, res, next) {
    // Chunked 전송은 Content-Length가 없을 수 있음 — Bolt raw-body 단계에서 별도 제한 (보고서 항목 5, 2026-04-10)
    const raw = req.headers['content-length'];
    if (raw === undefined || raw === '') {
      next();
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n > maxBytes) {
      res.status(413).setHeader('Connection', 'close').send('Payload Too Large');
      return;
    }
    next();
  };
}

module.exports = { createHttpPayloadLimitMiddleware };
