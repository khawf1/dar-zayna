# Deploying Dar Zayna

The site is one Node.js service: `npm run build` writes the 15 pages to `dist/`, and `npm start` serves them together with `POST /api/contact`. Everything below uses free plans only.

Facts below were checked on **22 November 2026** in Render's and Resend's own documentation. Providers change their plans, so check again before promising anything to a client.

You need two free accounts: **Resend** (email) and **Render** (hosting). Nobody else can create them for you, and you should never paste their keys into a chat, an issue or the code.

---

## Step 1: Resend (email for the contact form)

Free plan: **3,000 emails a month, 100 a day**.

1. Go to https://resend.com and sign up with the email address that should **receive** the contact messages.
2. Choose how you will send:
   - **A. Demo, no domain (simplest):**
     - The sender is `onboarding@resend.dev`.
     - Resend only delivers it to **the address of your Resend account**, so `CONTACT_TO_EMAIL` must be exactly that address.
     - This is enough for the portfolio demo.
   - **B. Real restaurant:**
     - Open **Domains → Add domain**, enter the restaurant's domain and add the DNS records Resend shows at the registrar. Wait until the domain shows as verified.
     - You can then send from any address on that domain, to any inbox.
3. Open **API Keys → Create API key**. Give it the permission to **send** only, not full access.
4. Copy the key, which starts with `re_`. Resend shows it only once. Keep it somewhere private (a password manager), and paste it only into Render in step 2.

## Step 2: Render (hosting)

`render.yaml` in this repository describes the whole service, so you only answer three questions.

1. Go to https://render.com and sign up with **GitHub** (the `khawf1` account).
2. When GitHub asks which repositories Render may access, choose **Only select repositories** and select **`dar-zayna`**. Render needs no other repository.
3. In the Render Dashboard, click **New**, then **Blueprint**.
4. Pick the **`khawf1/dar-zayna`** repository. Render reads `render.yaml` and shows one web service, `dar-zayna`, on the **Free** plan in **Frankfurt**.
5. Render asks for the three secret values. Enter them exactly as in the table below.
6. Confirm to create the Blueprint. The first build takes a few minutes.
7. When the service shows **Live**, its address is at the top of the service page, for example `https://dar-zayna.onrender.com`. If that name is taken, Render adds a suffix such as `dar-zayna-x1y2.onrender.com`.

### Environment variables

**You enter these three when Render asks:**

| Variable | What to enter | Option A (demo) | Option B (real) |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | The key from step 1.3, starting with `re_` | your key | your key |
| `CONTACT_TO_EMAIL` | Inbox that receives the messages | **your Resend account email** | the restaurant's inbox |
| `CONTACT_FROM_EMAIL` | Sender of the notifications | `Dar Zayna <onboarding@resend.dev>` | `Dar Zayna <site@restaurant-domain.ma>` |

**These come from `render.yaml`, so don't type them:**

| Variable | Value | Why |
| --- | --- | --- |
| `NODE_VERSION` | `22` | The Node.js version the code is tested on. Render's default is newer. |
| `TRUST_PROXY` | `1` | Express trusts Render's proxy for HTTPS details. |
| `CLIENT_IP_HEADER` | `cf-connecting-ip` | Render sits behind Cloudflare, which puts each visitor's real IP address in this header. Without it, all visitors could share one rate limit. |

**These are optional or automatic:**

| Variable | When |
| --- | --- |
| `PORT` | Set by Render automatically (10000). Do not add it. |
| `SITE_URL` | Not needed on onrender.com: the build uses Render's `RENDER_EXTERNAL_URL`. Add it only with a custom domain, for example `https://www.restaurant-domain.ma`. |
| `CONTACT_RATE_LIMIT`, `CONTACT_RATE_WINDOW_MINUTES` | Only to change the default of 5 messages per 15 minutes per visitor. |

Render asks for the `sync: false` values **only when the Blueprint is first created**. To change a value later: open the service, go to **Environment**, edit the value and save, then redeploy.

### Automatic deploys

`autoDeployTrigger: checksPass` means each push to `main` is deployed only after the GitHub Actions tests pass. A failing commit never goes live.

## Step 3: Check the live site

1. Open `https://<your-address>/healthz`. It should show `{"ok":true}`. If the service was asleep, the first load takes about a minute.
2. **Automated check of the whole site** (from a computer with this repository and Node.js 22). It covers all 15 pages, language switching, mobile widths, accessibility, links and form validation:

   ```bash
   npx playwright install chromium
   ```

   ```bash
   BASE_URL=https://<your-address> npm run test:live
   ```

   The two tests that would send a real email are skipped automatically.
3. **One real message, by hand:**
   - Open `/contact/`, fill in the form and send it.
   - You should see the green confirmation, and the email should arrive in `CONTACT_TO_EMAIL` within a minute. Check spam the first time.
   - Reply to it: the reply goes to the address typed in the form.
4. Open the site on your phone and switch between Français, العربية and English.

## What the free plans mean

- **Render sleeps after 15 minutes without visits.** The next visitor waits about **one minute** while Render shows a loading page. Fine for a demo or a portfolio, but not what a paying restaurant should get. For a client, budget for a paid instance or agree on the trade-off in writing.
- **Render gives 750 free instance hours a month per workspace**: enough for this one service all month. A second always-on free service would share the same hours.
- HTTPS and custom domains are included.
- Free services can't use SMTP ports (25, 465, 587). This site doesn't need them: it calls Resend over HTTPS.
- **Render's disk isn't permanent.** The site stores nothing on disk. The rate-limit counters live in memory and reset when the service restarts.
- Render says free instances are **not meant for production**.

## Custom domain (optional)

1. In Render, open the service, go to **Settings → Custom Domains**, add the domain and create the DNS record Render shows. HTTPS is issued automatically.
2. Add `SITE_URL=https://<the-domain>` under **Environment**, then redeploy.

## Troubleshooting

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Form says sending "is not switched on yet" | One of the three email variables is empty | Service → Environment: fill in all three, then redeploy |
| Form says the message "could not be sent", and the logs show `Resend answered 401` | Wrong or deleted API key | Create a new key in Resend and update `RESEND_API_KEY` |
| Same message, and the logs show `Resend answered 403` | Option A with a `CONTACT_TO_EMAIL` that is not your Resend account email, or a sender on an unverified domain | Use your account email (A) or verify the domain (B) |
| Same message, and the logs show `timeout` or `network error` | Resend unreachable for a moment | Try again; if it persists, check https://resend-status.com |
| Build fails | A broken commit (it would also fail GitHub Actions) | Open the failing build log in Render; run `npm test` locally |
| First page load takes a minute | The free instance was asleep | Expected on the free plan |

Render's logs (service → **Logs**) never contain what visitors typed. Only failures are logged, with their reason.

## Before going live with a real restaurant

- Real details in `frontend/src/data/site.js` and `demo: false` (see README).
- Option B: domain verified in Resend, and a test message received in the restaurant's inbox.
- `npm test` passes, and GitHub Actions is green.
- Every page opened on a real phone, in all three languages.
