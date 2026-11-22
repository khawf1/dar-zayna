import express from 'express';
import { isIP } from 'node:net';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { contactSchema, invalidFields } from './schema.js';
import { buildContactEmail } from './email.js';

/**
 * POST /api/contact
 *
 * Responses (always JSON):
 *   200 { ok: true }                                  email accepted by the email service
 *   400 { ok: false, error: 'validation', fields }    one or more fields are invalid
 *   400 { ok: false, error: 'invalid_json' }          body is not valid JSON
 *   400 { ok: false, error: 'rejected' }              honeypot field was filled in
 *   413 { ok: false, error: 'too_large' }             body over 10 kB
 *   415 { ok: false, error: 'unsupported_media_type' } body is not JSON
 *   429 { ok: false, error: 'rate_limited' }          too many messages from this address
 *   502 { ok: false, error: 'email_failed' }          the email service did not accept the email
 *   503 { ok: false, error: 'email_not_configured' }  the server has no email settings
 *
 * Nothing the visitor sends is stored or logged: it only goes into the email.
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
    // Count messages per visitor. Behind Render's proxies, req.ip can be a shared internal
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

  router.post('/api/contact', limiter, requireJson, express.json({ limit: '10kb' }), async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'validation', fields: [] });
    }

    // Honeypot. A person never sees this field. We answer with an honest error
    // (not a fake "sent") so that a real visitor whose browser autofilled it is not misled.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return res.status(400).json({ ok: false, error: 'rejected' });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'validation', fields: invalidFields(parsed.error) });
    }

    if (!sendEmail) {
      return res.status(503).json({ ok: false, error: 'email_not_configured' });
    }

    try {
      await sendEmail(buildContactEmail(parsed.data));
    } catch (err) {
      // Log the reason only (no visitor data), and tell the visitor the truth.
      console.error(`[contact] ${err?.message ?? 'email failed'}`);
      return res.status(502).json({ ok: false, error: 'email_failed' });
    }

    return res.status(200).json({ ok: true });
  });

  return router;
}
