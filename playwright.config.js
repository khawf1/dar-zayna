import { defineConfig, devices } from '@playwright/test';

// Local runs start a test server with a stand-in email sender.
// Set BASE_URL (e.g. https://dar-zayna.onrender.com) to check a deployed site instead;
// tests that would send a real email are then skipped.
const PORT = 4173;
const LIVE_URL = process.env.BASE_URL?.replace(/\/$/, '');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: !LIVE_URL, // be gentle with a free instance
  workers: LIVE_URL ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI || LIVE_URL ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: LIVE_URL ? 90_000 : 30_000,
  use: {
    baseURL: LIVE_URL || `http://127.0.0.1:${PORT}`,
    trace: 'off',
    navigationTimeout: LIVE_URL ? 90_000 : 15_000, // a sleeping free instance takes about a minute to wake
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium' }],
  webServer: LIVE_URL
    ? undefined
    : {
        command: 'node tests/e2e/server.js',
        url: `http://127.0.0.1:${PORT}/healthz`,
        env: { PORT: String(PORT) },
        reuseExistingServer: false,
        timeout: 20_000,
      },
});
