// Tests for the Cloudflare Worker (worker/index.js), run in Node with Request/Response objects.
// The email sender and the rate limiter are replaced by stand-ins; nothing leaves the machine.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../../worker/index.js';
import { EmailError } from '../../backend/contact/resend.js';

const valid = {
  name: 'Salma Benali',
  email: 'salma@example.com',
  phone: '',
  subject: 'information',
  message: 'Bonjour, proposez-vous des plats sans gluten ?',
  language: 'fr',
  website: '',
};

/** A fake environment: static assets answer "asset:<path>", the limiter allows `allowed` calls per key. */
function makeEnv({ allowed = Infinity, limiter = true, email = true } = {}) {
  const counts = new Map();
  return {
    ASSETS: { fetch: async (req) => new Response(`asset:${new URL(req.url).pathname}`) },
    CONTACT_LIMITER: limiter
      ? {
          limit: async ({ key }) => {
            const n = (counts.get(key) ?? 0) + 1;
            counts.set(key, n);
            return { success: n <= allowed };
          },
        }
      : undefined,
    ...(email ? { RESEND_API_KEY: 're_fake', CONTACT_TO_EMAIL: 'owner@example.com', CONTACT_FROM_EMAIL: 'Site <a@example.com>' } : {}),
  };
}

function post(body, { headers = {}, raw = false } = {}) {
  return new Request('https://dar-zayna.example/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body: raw ? body : JSON.stringify(body),
  });
}

describe('worker /api/contact', () => {
  test('sends the email and answers 200', async () => {
    const sent = [];
    const worker = createWorker({ createSender: () => async (e) => (sent.push(e), { id: 'x' }) });
    const res = await worker.fetch(post(valid), makeEnv());
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].replyTo, 'salma@example.com');
  });

  test('builds the real Resend sender from the variables', async () => {
    // Without email variables the default sender factory returns null: honest 503.
    const res = await createWorker().fetch(post(valid), makeEnv({ email: false }));
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { ok: false, error: 'email_not_configured' });
  });

  test('reports email failures honestly', async () => {
    const worker = createWorker({
      createSender: () => async () => {
        throw new EmailError('Resend answered 500');
      },
    });
    const original = console.error;
    console.error = () => {};
    try {
      const res = await worker.fetch(post(valid), makeEnv());
      assert.equal(res.status, 502);
      assert.deepEqual(await res.json(), { ok: false, error: 'email_failed' });
    } finally {
      console.error = original;
    }
  });

  test('validates fields with the same rules as the server', async () => {
    const worker = createWorker({ createSender: () => async () => ({ id: 'x' }) });
    const res = await worker.fetch(post({ ...valid, email: 'nope', message: 'short' }), makeEnv());
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).fields.sort(), ['email', 'message']);
  });

  test('refuses a filled honeypot', async () => {
    const worker = createWorker({ createSender: () => async () => assert.fail('must not send') });
    const res = await worker.fetch(post({ ...valid, website: 'spam' }), makeEnv());
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'rejected' });
  });

  test('limits each visitor separately', async () => {
    const worker = createWorker({ createSender: () => async () => ({ id: 'x' }) });
    const env = makeEnv({ allowed: 1 });
    assert.equal((await worker.fetch(post(valid), env)).status, 200);
    const limited = await worker.fetch(post(valid), env);
    assert.equal(limited.status, 429);
    assert.deepEqual(await limited.json(), { ok: false, error: 'rate_limited' });
    const other = await worker.fetch(post(valid, { headers: { 'CF-Connecting-IP': '198.51.100.20' } }), env);
    assert.equal(other.status, 200);
  });

  test('still works when the rate-limit binding is not available', async () => {
    const worker = createWorker({ createSender: () => async () => ({ id: 'x' }) });
    const res = await worker.fetch(post(valid), makeEnv({ limiter: false }));
    assert.equal(res.status, 200);
  });

  test('refuses other content types, bad JSON, big bodies and other methods', async () => {
    const worker = createWorker({ createSender: () => async () => ({ id: 'x' }) });
    const env = makeEnv();
    let res = await worker.fetch(post('name=x', { raw: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }), env);
    assert.equal(res.status, 415);
    res = await worker.fetch(post('{"name":', { raw: true }), env);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'invalid_json' });
    res = await worker.fetch(post({ ...valid, message: 'a'.repeat(11_000) }), env);
    assert.equal(res.status, 413);
    res = await worker.fetch(new Request('https://dar-zayna.example/api/contact'), env);
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
  });
});

describe('worker routing', () => {
  const worker = createWorker();

  test('health check', async () => {
    const res = await worker.fetch(new Request('https://dar-zayna.example/healthz'), makeEnv());
    assert.deepEqual(await res.json(), { ok: true });
  });

  test('unknown API routes answer JSON 404', async () => {
    const res = await worker.fetch(new Request('https://dar-zayna.example/api/nope'), makeEnv());
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
  });

  test('everything else goes to the static assets', async () => {
    const res = await worker.fetch(new Request('https://dar-zayna.example/ar/menu/'), makeEnv());
    assert.equal(await res.text(), 'asset:/ar/menu/');
  });
});
