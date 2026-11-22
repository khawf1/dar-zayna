# Dar Zayna: instructions for Claude

Client website for Dar Zayna, with a separate frontend and backend.

## Rules

- Stay inside `dar-zayna/`. Frontend changes go in `frontend/`, server changes in `backend/`; keep the API contract between them in sync.
- This is client work. Do not add analytics, trackers, third-party scripts or new paid services without asking first.
- Never put client names, contacts, prices or credentials in code, comments or commit messages.
- Secrets live in `.env`, which is ignored. When a new variable is needed, add it to `.env.example` with a placeholder value.
- Add or update tests in `tests/` for every change in behaviour, and run them before committing.
- Mobile first: every page must work at 360 px wide.
- Keep the README up to date when the run or deploy steps change.

## Stack

Frontend: HTML5, CSS3 and vanilla JavaScript in `frontend/`, no framework and no build step. Languages: French (default), Arabic (RTL) and English.
Backend: Node.js with Express, Zod (validation), Helmet (headers), express-rate-limit and Resend (email) in `backend/`. The backend also serves the frontend files, so one deployment runs the whole site.

Budget is zero: free tools and free hosting only. Never invent reviews, clients or business details; label demo content.

## Commands

| Task | Command |
| --- | --- |
| Install | |
| Run locally | |
| Test | |
| Build | |
