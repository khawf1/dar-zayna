import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { createResendSender } from './contact/resend.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(root, 'dist');

if (!fs.existsSync(path.join(staticDir, 'index.html'))) {
  console.error('The site has not been built. Run `npm run build` first.');
  process.exit(1);
}

const config = loadConfig();

const sendEmail = config.emailConfigured ? createResendSender(config.email) : null;
if (!sendEmail) {
  console.warn(
    '[contact] Email is not configured (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL). ' +
      'The contact form will answer that sending is unavailable.',
  );
}

const app = createApp({
  staticDir,
  sendEmail,
  rateLimit: config.rateLimit,
  trustProxy: config.trustProxy,
  clientIpHeader: config.clientIpHeader,
});

const server = app.listen(config.port, () => {
  console.log(`Dar Zayna is running on http://localhost:${config.port}`);
});

// Let the hosting platform stop the server cleanly.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
