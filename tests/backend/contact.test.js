import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../../backend/app.js';
import { buildContactEmail, escapeHtml } from '../../backend/contact/email.js';
import { createResendSender, EmailError } from '../../backend/contact/resend.js';
import { loadConfig } from '../../backend/config.js';

// A minimal built site so the static and 404 handlers have something to serve.
const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dz-static-'));
fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>home</title>');
fs.writeFileSync(path.join(staticDir, '404.html'), '<!doctype html><title>fr 404</title>');
fs.mkdirSync(path.join(staticDir, 'ar'));
fs.writeFileSync(path.join(staticDir, 'ar', '404.html'), '<!doctype html><title>ar 404</title>');

const valid = {
  name: 'Salma Benali',
  email: 'salma@example.com',
  phone: '+212 6 12 34 56 78',
  subject: 'reservation',
  message: 'Bonjour, une table pour quatre samedi soir ?',
  language: 'fr',
  website: '',
};

/** Starts the app on a random port and returns helpers. */
async function startServer({ sendEmail = async () => ({ id: 'test' }), limit = 100, clientIpHeader = '' } = {}) {
  const app = createApp({ staticDir, sendEmail, rateLimit: { windowMs: 60_000, limit }, clientIpHeader });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body, headers = { 'Content-Type': 'application/json' }) =>
    fetch(`${base}/api/contact`, {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { base, post, close: () => new Promise((r) => server.close(r)) };
}

describe('POST /api/contact', () => {
  let srv;
  const sent = [];
  before(async () => {
    srv = await startServer({
      sendEmail: async (email) => {
        sent.push(email);
        return { id: 'abc' };
      },
    });
  });
  after(() => srv.close());

  test('accepts a valid message and sends exactly one email', async () => {
    sent.length = 0;
    const res = await srv.post(valid);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].replyTo, valid.email);
    assert.match(sent[0].subject, /Demande de réservation/);
  });

  test('phone is optional', async () => {
    const { phone, ...noPhone } = valid;
    assert.equal((await srv.post(noPhone)).status, 200);
    assert.equal((await srv.post({ ...valid, phone: '' })).status, 200);
  });

  test('rejects an invalid email address', async () => {
    const res = await srv.post({ ...valid, email: 'not-an-email' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'validation', fields: ['email'] });
  });

  test('rejects missing and out-of-range fields and names each one', async () => {
    const res = await srv.post({ email: 'x@example.com', subject: 'party', message: 'short', language: 'de' });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'validation');
    for (const field of ['name', 'subject', 'message', 'language']) {
      assert.ok(body.fields.includes(field), `expected ${field} in ${body.fields}`);
    }
  });

  test('limits the message length', async () => {
    const res = await srv.post({ ...valid, message: 'a'.repeat(2001) });
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).fields, ['message']);
    assert.equal((await srv.post({ ...valid, message: 'a'.repeat(2000) })).status, 200);
  });

  test('rejects a phone number with letters or too few digits', async () => {
    for (const phone of ['call me', '12345', '+212 6 12 34 56 78 90 12 34']) {
      const res = await srv.post({ ...valid, phone });
      assert.equal(res.status, 400, phone);
      assert.deepEqual((await res.json()).fields, ['phone']);
    }
  });

  test('rejects unknown fields', async () => {
    const res = await srv.post({ ...valid, admin: true });
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).fields, ['admin']);
  });

  test('a filled honeypot is refused and sends nothing', async () => {
    sent.length = 0;
    const res = await srv.post({ ...valid, website: 'http://spam.example' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'rejected' });
    assert.equal(sent.length, 0);
  });

  test('line breaks in the name cannot reach the email subject', async () => {
    sent.length = 0;
    const res = await srv.post({ ...valid, name: 'Eve\r\nBcc: victim@example.com' });
    assert.equal(res.status, 200);
    assert.doesNotMatch(sent[0].subject, /[\r\n]/);
  });

  test('refuses bodies that are not JSON', async () => {
    const res = await srv.post('name=x', { 'Content-Type': 'application/x-www-form-urlencoded' });
    assert.equal(res.status, 415);
  });

  test('refuses malformed JSON', async () => {
    const res = await srv.post('{"name":', { 'Content-Type': 'application/json' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'invalid_json' });
  });

  test('refuses bodies over 10 kB', async () => {
    const res = await srv.post({ ...valid, message: 'a'.repeat(11_000) });
    assert.equal(res.status, 413);
  });

  test('refuses a JSON array', async () => {
    const res = await srv.post('[]');
    assert.equal(res.status, 400);
  });
});

describe('email failures are reported honestly', () => {
  test('502 when the email service fails, never a success', async () => {
    const srv = await startServer({
      sendEmail: async () => {
        throw new EmailError('Resend answered 500');
      },
    });
    const originalError = console.error;
    console.error = () => {};
    try {
      const res = await srv.post(valid);
      assert.equal(res.status, 502);
      assert.deepEqual(await res.json(), { ok: false, error: 'email_failed' });
    } finally {
      console.error = originalError;
      await srv.close();
    }
  });

  test('503 when email is not configured', async () => {
    const srv = await startServer({ sendEmail: null });
    try {
      const res = await srv.post(valid);
      assert.equal(res.status, 503);
      assert.deepEqual(await res.json(), { ok: false, error: 'email_not_configured' });
    } finally {
      await srv.close();
    }
  });
});

describe('rate limiting', () => {
  test('answers 429 after the limit', async () => {
    const srv = await startServer({ limit: 2 });
    try {
      assert.equal((await srv.post(valid)).status, 200);
      assert.equal((await srv.post(valid)).status, 200);
      const res = await srv.post(valid);
      assert.equal(res.status, 429);
      assert.deepEqual(await res.json(), { ok: false, error: 'rate_limited' });
      assert.ok(res.headers.get('ratelimit'), 'standard RateLimit header present');
    } finally {
      await srv.close();
    }
  });

  test('with CLIENT_IP_HEADER, each visitor has their own limit', async () => {
    const srv = await startServer({ limit: 1, clientIpHeader: 'cf-connecting-ip' });
    const as = (ip) => srv.post(valid, { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip });
    try {
      assert.equal((await as('203.0.113.7')).status, 200);
      assert.equal((await as('203.0.113.7')).status, 429);
      // Another visitor behind the same proxy is not blocked.
      assert.equal((await as('198.51.100.20')).status, 200);
    } finally {
      await srv.close();
    }
  });

  test('an invalid header value falls back to the connection address', async () => {
    const srv = await startServer({ limit: 1, clientIpHeader: 'cf-connecting-ip' });
    const as = (ip) => srv.post(valid, { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip });
    try {
      assert.equal((await as('not-an-ip')).status, 200);
      // Both junk values map to the same real address, so the second is limited.
      assert.equal((await as('also junk')).status, 429);
    } finally {
      await srv.close();
    }
  });
});

describe('site and security headers', () => {
  let srv;
  before(async () => {
    srv = await startServer();
  });
  after(() => srv.close());

  test('serves pages with security headers', async () => {
    const res = await fetch(`${srv.base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  test('unknown pages get a 404 page in the right language', async () => {
    const fr = await fetch(`${srv.base}/nope`, { headers: { Accept: 'text/html' } });
    assert.equal(fr.status, 404);
    assert.match(await fr.text(), /fr 404/);
    const ar = await fetch(`${srv.base}/ar/nope`, { headers: { Accept: 'text/html' } });
    assert.equal(ar.status, 404);
    assert.match(await ar.text(), /ar 404/);
  });

  test('unknown API routes answer JSON 404', async () => {
    const res = await fetch(`${srv.base}/api/unknown`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { ok: false, error: 'not_found' });
  });

  test('GET /api/contact is not allowed', async () => {
    const res = await fetch(`${srv.base}/api/contact`);
    assert.equal(res.status, 404);
  });

  test('health check', async () => {
    const res = await fetch(`${srv.base}/healthz`);
    assert.deepEqual(await res.json(), { ok: true });
  });
});

describe('email template', () => {
  test('escapes HTML typed by the visitor', () => {
    const email = buildContactEmail({
      ...valid,
      name: '<script>alert(1)</script>',
      message: '<img src=x onerror=alert(1)> & "quotes"',
    });
    assert.doesNotMatch(email.html, /<script>|<img src=x/);
    assert.match(email.html, /&lt;script&gt;/);
    assert.match(email.html, /&amp; &quot;quotes&quot;/);
    // The plain-text version keeps the original characters.
    assert.match(email.text, /<img src=x onerror=alert\(1\)>/);
  });

  test('escapeHtml covers the five special characters', () => {
    assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('Resend sender', () => {
  const opts = { apiKey: 're_test', from: 'Site <a@example.com>', to: 'b@example.com' };
  const email = { subject: 's', text: 't', html: '<p>h</p>', replyTo: 'c@example.com' };

  test('sends the right request and returns the id', async () => {
    let call;
    const send = createResendSender({
      ...opts,
      fetchImpl: async (url, init) => {
        call = { url, init };
        return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
      },
    });
    assert.deepEqual(await send(email), { id: 'email_123' });
    assert.equal(call.url, 'https://api.resend.com/emails');
    assert.equal(call.init.headers.Authorization, 'Bearer re_test');
    const body = JSON.parse(call.init.body);
    assert.deepEqual(body.to, ['b@example.com']);
    assert.equal(body.reply_to, 'c@example.com');
  });

  test('throws on an error status, without leaking the key', async () => {
    const send = createResendSender({
      ...opts,
      fetchImpl: async () => new Response('{"message":"invalid"}', { status: 422 }),
    });
    await assert.rejects(send(email), (err) => {
      assert.ok(err instanceof EmailError);
      assert.doesNotMatch(err.message, /re_test/);
      return true;
    });
  });

  test('throws on a network error', async () => {
    const send = createResendSender({
      ...opts,
      fetchImpl: async () => {
        throw new TypeError('fetch failed');
      },
    });
    await assert.rejects(send(email), EmailError);
  });

  test('throws when the response has no id', async () => {
    const send = createResendSender({ ...opts, fetchImpl: async () => new Response('{}', { status: 200 }) });
    await assert.rejects(send(email), EmailError);
  });
});

describe('config', () => {
  test('email counts as configured only with all three settings', () => {
    assert.equal(loadConfig({}).emailConfigured, false);
    assert.equal(loadConfig({ RESEND_API_KEY: 'k', CONTACT_TO_EMAIL: 'a@b.c' }).emailConfigured, false);
    assert.equal(
      loadConfig({ RESEND_API_KEY: 'k', CONTACT_TO_EMAIL: 'a@b.c', CONTACT_FROM_EMAIL: 'x@y.z' }).emailConfigured,
      true,
    );
  });

  test('parses TRUST_PROXY', () => {
    assert.equal(loadConfig({}).trustProxy, false);
    assert.equal(loadConfig({ TRUST_PROXY: '1' }).trustProxy, 1);
    assert.equal(loadConfig({ TRUST_PROXY: 'true' }).trustProxy, true);
  });

  test('reads CLIENT_IP_HEADER in lower case', () => {
    assert.equal(loadConfig({}).clientIpHeader, '');
    assert.equal(loadConfig({ CLIENT_IP_HEADER: 'CF-Connecting-IP' }).clientIpHeader, 'cf-connecting-ip');
  });
});
