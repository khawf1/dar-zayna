/**
 * Cloudflare Worker: the free way to host Dar Zayna.
 *
 * Static pages, images and fonts in dist/ are served directly by Cloudflare (free and
 * unlimited, security headers from dist/_headers). This script only runs for /api/* and
 * /healthz (see run_worker_first in wrangler.jsonc). It applies the same rules as the
 * Express server and calls the same contact logic (backend/contact/handler.js).
 *
 * Settings come from the Worker's variables and secrets:
 *   RESEND_API_KEY (secret), CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL.
 * Optional binding CONTACT_LIMITER (Cloudflare rate limiting): when it is missing the
 * form still works, without the per-visitor limit.
 */
import { handleContact, MAX_BODY_BYTES } from '../backend/contact/handler.js';
import { createResendSender } from '../backend/contact/resend.js';

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });

/** Builds the email sender from the Worker's settings, or null when they are incomplete. */
function senderFromEnv(env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  return apiKey && to && from ? createResendSender({ apiKey, to, from }) : null;
}

/** Reads at most MAX_BODY_BYTES of the body; returns null when it is larger. */
async function readLimitedText(request) {
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY_BYTES) return null;
  const text = await request.text();
  return new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES ? null : text;
}

async function contact(request, env, createSender) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
  }

  // One visitor, one counter. Cloudflare sets CF-Connecting-IP itself; visitors cannot fake it.
  if (env.CONTACT_LIMITER) {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const { success } = await env.CONTACT_LIMITER.limit({ key: `contact:${ip}` });
    if (!success) return json(429, { ok: false, error: 'rate_limited' });
  }

  const type = request.headers.get('content-type') || '';
  if (!/^application\/json\b/i.test(type)) {
    return json(415, { ok: false, error: 'unsupported_media_type' });
  }

  const text = await readLimitedText(request);
  if (text === null) return json(413, { ok: false, error: 'too_large' });

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const result = await handleContact(body, { sendEmail: createSender(env) });
  return json(result.status, result.body);
}

/** Factory so tests can replace the email sender. */
export function createWorker({ createSender = senderFromEnv } = {}) {
  return {
    async fetch(request, env) {
      const { pathname } = new URL(request.url);
      try {
        if (pathname === '/api/contact') return await contact(request, env, createSender);
        if (pathname === '/healthz') return json(200, { ok: true });
        if (pathname.startsWith('/api/')) return json(404, { ok: false, error: 'not_found' });
        // Anything else is a page or file: hand it to the static assets.
        return env.ASSETS.fetch(request);
      } catch (err) {
        console.error(`[worker] ${err?.message ?? err}`);
        return json(500, { ok: false, error: 'server_error' });
      }
    },
  };
}

export default createWorker();
