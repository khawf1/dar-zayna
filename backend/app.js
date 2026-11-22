import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import { createContactRouter } from './contact/route.js';

const LANGS = ['ar', 'en']; // French lives at the site root.

/**
 * Creates the Express app. Kept separate from server.js so tests can build it
 * with a fake email sender and without opening a real port.
 *
 * @param {object} options
 * @param {string} options.staticDir  folder produced by `npm run build`
 * @param {Function|null} options.sendEmail
 * @param {{windowMs:number, limit:number}} options.rateLimit
 * @param {boolean|number|string} [options.trustProxy]
 * @param {string} [options.clientIpHeader]
 */
export function createApp({ staticDir, sendEmail, rateLimit, trustProxy = false, clientIpHeader = '' }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      // Lets wa.me / external links open without the opener reference issues; pages embed no third-party content.
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.get('/healthz', (req, res) => res.json({ ok: true }));

  app.use(createContactRouter({ sendEmail, rateLimit, clientIpHeader }));

  // Unknown API routes get JSON, not an HTML page.
  app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

  app.use(
    express.static(staticDir, {
      extensions: ['html'],
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(css|js)$/.test(filePath)) {
          // URLs carry a ?v=<hash> that changes with the content.
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=604800');
        }
      },
    }),
  );

  // 404 page in the visitor's language.
  app.use((req, res) => {
    const lang = LANGS.find((l) => req.path === `/${l}` || req.path.startsWith(`/${l}/`));
    const page = path.join(staticDir, lang ?? '', '404.html');
    res.status(404);
    if (req.accepts('html') && fs.existsSync(page)) return res.sendFile(page);
    res.type('text').send('Not found');
  });

  // Errors from body parsing and anything unexpected.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, error: 'too_large' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'invalid_json' });
    console.error(`[server] ${err?.message ?? err}`);
    res.status(500).json({ ok: false, error: 'server_error' });
  });

  return app;
}
