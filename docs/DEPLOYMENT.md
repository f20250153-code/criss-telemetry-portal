# Deployment Guide

Target architecture: **Vercel** (frontend) + **Railway or Render**
(backend + managed Postgres). Config for both backend targets is
already in the repo (`railway.json`, `render.yaml`) — pick one, you
don't need both.

> This guide was written and every config file in it was validated
> (JSON/YAML syntax, Dockerfile paths, matching env var names against
> the actual code) from a sandbox with no access to Vercel/Railway/
> Render and no GitHub push credentials. The steps below haven't been
> executed end-to-end by Claude — walk through them yourself (or ask
> Claude to continue from wherever you are, with a browser or the
> Railway/Vercel connectors available, and it can drive the dashboards
> directly).

## 1. Push to GitHub

This repo has full commit history (one commit per build phase) but has
never been pushed anywhere — create a repo and push it yourself:

```bash
# on github.com, create a new empty repository, then:
git remote add origin https://github.com/<you>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. Deploy the backend (Railway or Render)

Both reuse `apps/server/Dockerfile` from Phase 10 — no separate build
config to maintain.

### Option A — Railway

1. New Project → Deploy from GitHub repo → select this repo. Railway
   will detect `railway.json` and use the Dockerfile automatically.
2. Add a PostgreSQL database to the project (Railway → New → Database
   → PostgreSQL). Railway injects `DATABASE_URL` automatically if you
   reference it — otherwise copy the connection string it generates.
3. Set service environment variables:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | from the Railway Postgres plugin |
   | `JWT_SECRET` | generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `1h` |
   | `CORS_ORIGIN` | your Vercel URL (set after step 3 below; a placeholder is fine for the first deploy) |
4. Deploy. Railway assigns a public URL — this is your backend URL.

### Option B — Render

1. Dashboard → Blueprints → New Blueprint Instance → point at this
   repo. Render reads `render.yaml` and provisions the web service +
   managed Postgres database together.
2. Render auto-wires `DATABASE_URL` from the blueprint's `fromDatabase`
   reference. In the dashboard, set the two `sync: false` variables
   manually: `JWT_SECRET` (generate one, same command as above) and
   `CORS_ORIGIN` (placeholder for now).
3. Deploy. Render assigns a public URL — this is your backend URL.

### Verify the backend before moving on

```bash
curl https://<your-backend-url>/health
# {"status":"ok"}
curl https://<your-backend-url>/health/db
# {"status":"ok","database":"connected"}
```

If `/health/db` fails, check the deploy logs — the container's
entrypoint (`apps/server/docker-entrypoint.sh`) logs whether it applied
migrations via the real Prisma CLI or the fallback script (see README
"A note on Prisma in this repo").

Seed the dev accounts once, from your own machine, pointed at the
production database:
```bash
DATABASE_URL="<production connection string>" npm run db:seed --workspace=apps/server
```
Or open a one-off shell on the platform (Railway: `railway run`,
Render: dashboard Shell tab) and run the same command.

## 3. Deploy the frontend (Vercel)

1. New Project → import this GitHub repo.
2. **Root Directory**: `apps/web` — Vercel auto-detects the npm
   workspace root (via `package-lock.json` at the repo root) and
   installs/builds correctly across the monorepo; no build command
   override needed.
3. Environment variables:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your backend URL from step 2 |
   | `NEXT_PUBLIC_SOCKET_URL` | same backend URL |
4. Deploy. Vercel assigns your production frontend URL.

## 4. Close the loop: update backend CORS

Go back to your backend service (Railway/Render) and set `CORS_ORIGIN`
to the real Vercel URL from step 3, then redeploy the backend. Until
this matches exactly, the browser will block API/Socket.IO requests
from the deployed frontend (see `apps/server/src/app.ts` and
`src/realtime/socket.ts`, both keyed off `CORS_ORIGIN`).

## 5. End-to-end verification

1. Open the Vercel URL.
2. Log in as viewer (`vineet@criss-robotics.dev` / `Vineet@123!`).
3. Confirm the dashboard loads and the connection badge shows "Live".
4. Confirm no engineer panel is visible.
5. Log out, log in as engineer (`biswajit@criss-robotics.dev` / `Biswajit@123!`).
6. Confirm the engineer panel is visible.
7. Click "Generate mock telemetry" — confirm the stat cards, chart, and
   recent-readings list update immediately, with no page reload.
8. Open a second browser/incognito window as the viewer while the
   engineer triggers a reading — confirm the viewer's dashboard updates
   live too (proves the broadcast, not just the triggering client's
   own state, is real).

## Known limitations at this scale

- Socket.IO uses the default in-memory adapter and the mock-telemetry
  "current reading" is an in-memory variable in `telemetryService.ts` —
  both are fine for a single backend instance (what Railway/Render give
  you by default) but wouldn't work correctly if you later scale to
  multiple instances without adding a Redis adapter and shared state.
- Rate limiting (`express-rate-limit`) is also in-memory per instance,
  same caveat.
- Change the seeded dev credentials (or seed different ones) before
  sharing the deployed URL publicly.
