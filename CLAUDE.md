# Dar Zayna: instructions for Claude

Website for a Moroccan restaurant in French (default), Arabic (RTL) and English, with an Express contact API. Currently a demo: the restaurant is fictional.

## Rules

- Stay inside `dar-zayna/`. Page changes go in `frontend/`, server changes in `backend/`; keep the contact API contract (README, "Contact API") in sync on both sides. The browser rules in `frontend/static/js/main.js` mirror `backend/contact/schema.js`.
- This is client work. Do not add analytics, trackers, third-party scripts, CDNs or paid services without asking first. The CSP allows only same-origin scripts, styles, fonts and images, with no inline scripts or styles.
- Never put real customer data, credentials or private client details in code, comments or commit messages. Public website content (menu, prices, opening hours) belongs in `frontend/src/data/`.
- Secrets live in `.env`, which is ignored. When a new variable is needed, add it to `.env.example` with a placeholder value, and to `render.yaml` if the host needs it.
- Every text change goes into all three of `frontend/src/i18n/fr.js`, `ar.js` and `en.js`. The build fails if their keys differ.
- Arabic: use logical CSS properties (`inline`/`block`), never `letter-spacing` or `text-transform` on Arabic text, and check `/ar/` pages after layout changes.
- Never invent reviews, testimonials, awards or business facts. Demo content stays labelled while `demo: true` in `frontend/src/data/site.js`.
- The contact form must only report success when the email service confirmed it.
- Add or update tests in `tests/` for every change in behaviour, and run `npm test` before committing.
- Mobile first: every page must work at 360 px wide (the tests check 360, 768 and 1280).
- Keep the README and DEPLOYMENT.md up to date when the run or deploy steps change.

## Stack

- **Pages:** HTML5, CSS3 and vanilla JavaScript. `frontend/build.js` is a small Node script with no dependencies. It writes every page in every language from `frontend/src/` (data, text, templates) to `dist/`, and copies `frontend/static/` (CSS, JS, images, fonts) next to them.
- **Server:** Node.js 22 with Express 5, Zod 4 (validation), Helmet 8 (headers), express-rate-limit 8 and the Resend HTTP API (email) in `backend/`. The server also serves `dist/`, so one deployment runs the whole site.
- **Photos:** `scripts/optimize_images.py` (needs Pillow) turns source photos into WebP files and updates `frontend/src/data/images.json`.
- **Hosting:** Render free web service via `render.yaml`. See DEPLOYMENT.md.

Budget is zero: free tools and free hosting only.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Run locally | `npm run dev`, then open http://localhost:3000 |
| Test | `npm test` (backend, then Playwright) |
| Build | `npm run build` |
| Photos | `python3 scripts/optimize_images.py <folder>` |
