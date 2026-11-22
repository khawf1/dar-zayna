# Deploying Dar Zayna

The site is a single Node.js service: `npm run build` writes the pages to `dist/`, and `npm start` serves them together with `POST /api/contact`. Any host that runs Node.js 22 works. The steps below use free tiers only.

Limits below were checked on 22 November 2026 on the providers' own pages. They change, so check again before promising anything to a client.

## 1. Email: Resend (free)

Resend's free plan: **3,000 emails a month, 100 a day, 3 domains**.

1. Create an account at https://resend.com.
2. **Domains → Add domain:** add the restaurant's domain and create the DNS records Resend shows, at the domain registrar. Without a verified domain, Resend only lets you send from `onboarding@resend.dev`, and then only to your own Resend account address: good for a first test, not for a client.
3. **API Keys → Create API key** with "Sending access" only. Copy it once; it is not shown again.
4. Choose the three values for the next step:
   - `RESEND_API_KEY`: the key from step 3.
   - `CONTACT_TO_EMAIL`: the inbox that receives the messages, for example the restaurant's address.
   - `CONTACT_FROM_EMAIL`: a sender on the verified domain, for example `Dar Zayna <site@restaurant-domain.ma>`.

Never put these values in the code or commit them. They go in the host's environment settings (or in `.env` locally, which Git ignores).

## 2. Hosting: Render (free web service)

`render.yaml` in this repository describes the service:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --omit=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/healthz` |
| Node version | 22 |
| `TRUST_PROXY` | 1 |

`TRUST_PROXY=1` makes rate limiting see the visitor's IP address rather than Render's proxy.

1. Sign in at https://render.com with GitHub.
2. Choose **New → Blueprint** and pick the `dar-zayna` repository. Render reads `render.yaml`.
3. When asked, fill in `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL`. Fill in `SITE_URL` once you know the address, for example `https://dar-zayna.onrender.com`, then redeploy so canonical links and social previews use it.
4. Deploy. Render builds again on every push to `main`.
5. Check:
   - `https://<your-service>.onrender.com/healthz` answers `{"ok":true}`.
   - Send yourself a message through the contact form.
   - The Render logs never contain visitor data. Only failures are logged, with their reason.

### What the free tier means

- **It sleeps after 15 minutes without visits.** The next visitor waits about **one minute** while Render shows a loading page. Fine for a demo or portfolio. For a real restaurant, use a paid instance or another host that stays awake.
- **750 free instance hours per month per workspace**: enough for one service running all month.
- **HTTPS and custom domains are included.**
- **Outbound SMTP ports (25, 465, 587) are blocked** on free services. This site does not use SMTP: it calls Resend over HTTPS, so it is not affected.
- **The filesystem is temporary.** The site stores nothing on disk, so nothing is lost on restarts. The rate-limit counters live in memory and reset when the service restarts, which is acceptable for a small site.
- Render says free instances are **not meant for production**. For a paying client, budget for a small paid instance or agree on the trade-off in writing.

## 3. Custom domain (optional)

In Render, open the service, go to **Settings → Custom Domains**, add the domain and create the DNS record Render shows. HTTPS is issued automatically. Then set `SITE_URL` to the new address and redeploy.

## 4. Before going live with a real restaurant

- Real details in `frontend/src/data/site.js` and `demo: false` (see README).
- Domain verified in Resend, and a test message received in the restaurant's inbox.
- `npm test` passes, and GitHub Actions is green.
- Open every page on a real phone, in all three languages.
