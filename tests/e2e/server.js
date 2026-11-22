/**
 * Server used only by the Playwright tests: the real app, with a stand-in email sender
 * so the tests never send real email. A message containing SIMULATE_EMAIL_FAILURE makes
 * the stand-in fail, to check that the site reports the failure honestly.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../backend/app.js';
import { EmailError } from '../../backend/contact/resend.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function sendEmail(email) {
  if (email.text.includes('SIMULATE_EMAIL_FAILURE')) throw new EmailError('simulated failure');
  return { id: 'test-email' };
}

const app = createApp({
  staticDir: path.join(root, 'dist'),
  sendEmail,
  rateLimit: { windowMs: 60_000, limit: 1000 },
});

const port = Number(process.env.PORT) || 4173;
app.listen(port, '127.0.0.1', () => console.log(`Test server on http://127.0.0.1:${port}`));
