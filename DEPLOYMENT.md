# Deploying Dar Zayna (free)

Dar Zayna is hosted on **Cloudflare Workers, free plan**:

- **Static pages, images and fonts** are served by Cloudflare directly: free and unlimited, worldwide, always on, with no sleeping.
- **The contact form** (`POST /api/contact`) runs in a small Worker (`worker/index.js`). It uses the same validation and email code as the Express server, and only these requests count toward the free allowance of **100,000 requests a day**.
- **Email** goes through **Resend, free plan**: 3,000 emails a month, 100 a day.

Facts above were checked on **22 November 2026** in Cloudflare's and Resend's documentation. Providers change their plans, so check again before promising anything to a client.

You need two free accounts, Resend and Cloudflare. Create them yourself, and never paste keys into a chat, an issue or the code.

---

## Step 1: Resend (email for the contact form)

1. Go to https://resend.com and sign up with the email address that should **receive** the contact messages.
2. Choose how you will send:
   - **A. Demo, no domain (simplest):**
     - The sender is `onboarding@resend.dev`.
     - Resend only delivers it to **the address of your Resend account**, so `CONTACT_TO_EMAIL` must be exactly that address.
   - **B. Real restaurant:**
     - Open **Domains → Add domain**, enter the restaurant's domain and add the DNS records Resend shows. Wait until it shows as verified.
     - You can then send from any address on that domain, to any inbox.
3. Open **API Keys → Create API key** with permission to **send** only.
4. Copy the key, which starts with `re_`. Resend shows it once. Keep it in a password manager, and paste it only into Cloudflare in step 2.

## Step 2: Cloudflare (hosting)

1. Go to https://dash.cloudflare.com/sign-up and create a free account. Confirm your email address. Cloudflare's free plan normally doesn't ask for a card; if it does, stop there and tell me.
2. In the dashboard, open **Workers & Pages** and choose **Create**. Then pick the option to **import a repository** from Git, and connect **GitHub**.
3. When GitHub asks which repositories Cloudflare may access, choose **Only select repositories → `dar-zayna`**.
4. Select **`khawf1/dar-zayna`**, then set:

   | Setting | Value |
   | --- | --- |
   | Project / Worker name | `dar-zayna` (must match `name` in `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `npm run test:backend` (deploys stop if the backend tests fail) |
   | Deploy command | `npx wrangler deploy` |

   Leave everything else as proposed.
5. Start the deployment. `wrangler deploy` runs `node frontend/build.js` itself (see `build` in `wrangler.jsonc`), then uploads `dist/` and the Worker. The address appears when it finishes, like `https://dar-zayna.<your-subdomain>.workers.dev`.

### Step 3: Add the email settings

The first deploy works without email: the form tells visitors honestly that sending isn't switched on yet. To switch it on, open **Workers & Pages → dar-zayna → Settings → Variables and Secrets**. Add each of these three with the type **Secret**, so later deploys never remove them:

| Name | Value, option A (demo) | Value, option B (real restaurant) |
| --- | --- | --- |
| `RESEND_API_KEY` | your Resend key (`re_…`) | your Resend key |
| `CONTACT_TO_EMAIL` | **your Resend account email** | the restaurant's inbox |
| `CONTACT_FROM_EMAIL` | `Dar Zayna <onboarding@resend.dev>` | `Dar Zayna <site@restaurant-domain.ma>` |

Save. The values apply to the next request, with no rebuild needed.

### Step 4: The site address (for links and social previews)

Pages contain their full address in canonical links and social-preview tags.
1. In **Settings → Build → Variables and secrets** (the *build* settings, not the ones above), add a variable `SITE_URL` with the address from step 2.5, for example `https://dar-zayna.<your-subdomain>.workers.dev`.
2. Then retry the deployment from the **Deployments** tab, or push any commit.

With a custom domain, use that domain instead.

## What is already configured (no action needed)

`wrangler.jsonc` in this repository sets:

| Setting | Value | Why |
| --- | --- | --- |
| `assets.directory` | `./dist` | The generated site |
| `assets.not_found_handling` | `404-page` | Unknown URLs get the nearest `404.html`, so `/ar/...` gets the Arabic one |
| `assets.html_handling` | `auto-trailing-slash` | `/menu` → `/menu/` |
| `assets.run_worker_first` | `/api/*`, `/healthz` | Only these run code. Every page and image is served directly. |
| `ratelimits` | 3 messages per minute per visitor | Approximate, per Cloudflare location. Keyed on `CF-Connecting-IP`, which visitors cannot fake. |
| `keep_vars` | `true` | Deploys don't wipe variables set in the dashboard |

The security headers (Content Security Policy and others) are written to `dist/_headers` by the build, from `backend/security-headers.js`, the same source the Express server uses.

## Step 5: Check the live site

1. Open `https://<your-address>/healthz`. It should show `{"ok":true}`.
2. **Whole-site check** (from a computer with this repository and Node.js 22). It covers all 15 pages, language switching, mobile widths, accessibility, links and form validation, and sends no email:

   ```bash
   npx playwright install chromium
   ```

   ```bash
   BASE_URL=https://<your-address> npm run test:live
   ```

3. **One real message, by hand:**
   - Open `/contact/`, fill in the form and send it.
   - You should get the green confirmation, and the email should reach `CONTACT_TO_EMAIL` within a minute. Check spam the first time.
   - Replying goes to the address typed in the form.
4. Open the site on your phone and switch between Français, العربية and English.

## Updates

Every push to `main` triggers a new build and deploy on Cloudflare. GitHub Actions runs all the tests on the same push, including the browser tests against the Worker in Cloudflare's local runtime (`npm run test:worker`). Keep it green.

## Custom domain (optional)

1. Open **Workers & Pages → dar-zayna → Settings → Domains & Routes → Add → Custom domain**. The domain must use Cloudflare for its DNS, which is free.
2. Set the build variable `SITE_URL` to the new address, then redeploy.

## Troubleshooting

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Form says sending "is not switched on yet" | One of the three secrets is missing | Settings → Variables and Secrets: add all three (step 3) |
| Form says the message "could not be sent" | Resend refused the email | Open **Workers & Pages → dar-zayna → Logs**: `Resend answered 401` means a wrong key; `403` means option A with the wrong `CONTACT_TO_EMAIL`, or an unverified domain |
| Deploy fails and mentions `ratelimits` | Rate limiting isn't available on the account | Remove the `ratelimits` block from `wrangler.jsonc` and push. The form keeps working (honeypot and validation stay), only the per-minute limit is gone. |
| Deploy fails on the build command | A backend test fails | Run `npm test` locally and fix it |
| Links in social previews show `localhost` | `SITE_URL` build variable not set | Step 4 |

The Worker's logs never contain what visitors typed. Only failures are logged, with their reason.

## Other hosts

The Express server (`npm start`) still runs on any Node.js 22 host. Use `.env.example` for its settings, `TRUST_PROXY=1` behind a proxy, and `CLIENT_IP_HEADER` when the proxy provides the visitor's IP in a trusted header.

## Before going live with a real restaurant

- Real details in `frontend/src/data/site.js` and `demo: false` (see README).
- Option B: domain verified in Resend, and a test message received in the restaurant's inbox.
- `npm test` passes, and GitHub Actions is green.
- Every page opened on a real phone, in all three languages.
