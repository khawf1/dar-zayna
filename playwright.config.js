import { defineConfig, devices } from '@playwright/test';

// Local runs start a test server with a stand-in email sender.
// Set BASE_URL (e.g. https://dar-zayna.example.workers.dev) to check a deployed site instead;
// tests that would send a real email are then skipped.
// TEST_TARGET=worker runs the same tests against the Cloudflare Worker in Wrangler's local
// runtime, which is exactly what gets deployed.
const PORT = 4173;
const WORKER_PORT = 8788;
const WORKER = process.env.TEST_TARGET === 'worker';
if (WORKER) process.env.BASE_URL = `http://127.0.0.1:${WORKER_PORT}`;
const LIVE_URL = process.env.BASE_URL?.replace(/\/$/, '');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: !LIVE_URL || WORKER, // be gentle with a deployed site
  workers: LIVE_URL && !WORKER ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI || (LIVE_URL && !WORKER) ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: LIVE_URL ? 90_000 : 30_000,
  use: {
    baseURL: LIVE_URL || `http://127.0.0.1:${PORT}`,
    trace: 'off',
    navigationTimeout: LIVE_URL ? 90_000 : 15_000, // a sleeping free instance takes about a minute to wake
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium' }],
  webServer: WORKER
    ? {
        command: `npx wrangler dev --port ${WORKER_PORT} --ip 127.0.0.1`,
        url: `http://127.0.0.1:${WORKER_PORT}/healthz`,
        env: { WRANGLER_SEND_METRICS: 'false' },
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : LIVE_URL
    ? undefined
    : {
        command: 'node tests/e2e/server.js',
        url: `http://127.0.0.1:${PORT}/healthz`,
        env: { PORT: String(PORT) },
        reuseExistingServer: false,
        timeout: 20_000,
      },
});
