import express from 'express';
import { isIP } from 'node:net';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { handleContact, MAX_BODY_BYTES } from './handler.js';

/**
 * POST /api/contact for the Express server: rate limit, JSON only, 10 kB body limit,
 * then the shared logic in handler.js. Extra answers from this layer:
 *   400 invalid_json, 413 too_large, 415 unsupported_media_type, 429 rate_limited.
 *
 * @param {object} options
 * @param {((email: object) => Promise<{id: string}>) | null} options.sendEmail  null when email is not configured
 * @param {{windowMs: number, limit: number}} options.rateLimit
 * @param {string} [options.clientIpHeader]  header holding the visitor's IP (see config.js)
 */
export function createContactRouter({ sendEmail, rateLimit: limits, clientIpHeader = '' }) {
  const router = express.Router();

  const limiter = rateLimit({
    windowMs: limits.windowMs,
    limit: limits.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Count messages per visitor. Behind some hosts' proxies, req.ip can be a shared internal
    // address, so a trusted header is preferred when configured and valid.
    keyGenerator: (req) => {
      const fromHeader = clientIpHeader ? req.get(clientIpHeader)?.trim() : '';
      return ipKeyGenerator(fromHeader && isIP(fromHeader) ? fromHeader : req.ip);
    },
    handler: (req, res) => res.status(429).json({ ok: false, error: 'rate_limited' }),
  });

  const requireJson = (req, res, next) => {
    if (!req.is('application/json')) {
      return res.status(415).json({ ok: false, error: 'unsupported_media_type' });
    }
    next();
  };

  router.post('/api/contact', limiter, requireJson, express.json({ limit: MAX_BODY_BYTES }), async (req, res) => {
    const result = await handleContact(req.body, { sendEmail });
    res.status(result.status).json(result.body);
  });

  return router;
}
