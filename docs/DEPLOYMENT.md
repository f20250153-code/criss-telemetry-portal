# Deployment Guide

Frontend on Vercel, backend + Postgres on Railway (or Render, if you'd rather — config for both is already in the repo: `railway.json` and `render.yaml`, pick one).

This is written from actually deploying it — https://criss-telemetry-portal.vercel.app is live, backed by https://criss-telemetry-portal-production.up.railway.app. If you're setting up your own copy, here's the path that worked.

## 1. Push to GitHub

```bash
git remote add origin https://github.com/<you>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. Deploy the backend

Both options reuse `apps/server/Dockerfile` — nothing extra to configure there.

### Railway

1. New Project → Deploy from GitHub repo → pick this repo. It picks up `railway.json` and builds from the Dockerfile automatically.
2. Add a PostgreSQL database to the same project (New → Database → PostgreSQL).
3. On the app service, set these variables:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | reference the Postgres service's connection string |
   | `JWT_SECRET` | generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `1h` |
   | `CORS_ORIGIN` | your Vercel URL — a placeholder is fine for now, you'll set the real one in step 4 |
4. Deploy, and grab the public URL Railway gives you.

One thing worth knowing if you hit it: Railway's auto-deploy-on-push isn't always instant. If a push doesn't trigger a new build after a minute or two, use the `...` menu on the latest deployment → Redeploy, or push an empty commit (`git commit --allow-empty -m "trigger build"`) to force it.

### Render

1. Dashboard → Blueprints → New Blueprint Instance → point at the repo. `render.yaml` provisions the web service and a managed Postgres database together.
2. Set the two variables marked `sync: false` in the dashboard — `JWT_SECRET` and `CORS_ORIGIN` (same as above).
3. Deploy, grab the URL.

### Check the backend before moving on

```bash
curl https://<your-backend-url>/health
curl https://<your-backend-url>/health/db
```
Both should come back with `"status":"ok"`. If `/health/db` fails, check the deploy logs — the entrypoint script logs whether migrations went through the real Prisma CLI or the fallback script (see the README's note on Prisma).

The demo accounts get seeded automatically on every deploy (it's idempotent, so this is safe) — no manual step needed there.

## 3. Deploy the frontend

1. New Project on Vercel → import the repo.
2. Set **Root Directory** to `apps/web`. Vercel figures out the rest of the monorepo on its own from the root `package-lock.json`.
3. Environment variables:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your backend URL from step 2 |
   | `NEXT_PUBLIC_SOCKET_URL` | same backend URL |
4. Deploy.

Vercel will give you a stable production domain (something like `your-project.vercel.app`) plus per-deployment preview URLs with random hashes — use the stable one for anything you're sharing.

## 4. Point the backend at the real frontend URL

Go back to Railway/Render and update `CORS_ORIGIN` to the actual Vercel domain from step 3, then let it redeploy. Until these match exactly, the browser blocks every API and socket request from the frontend — this is the step that's easy to forget and the one thing most likely to leave you with a working backend and a broken-looking frontend.

## 5. Actually test it

1. Open the Vercel URL.
2. Log in as the viewer account, confirm the dashboard loads and shows "Live."
3. Confirm there's no engineer panel.
4. Log out, log in as the engineer account, confirm the panel's there now.
5. Trigger a mock reading, confirm the numbers and chart update without a reload.
6. Open a second window logged in as the viewer while the engineer triggers something — confirm it shows up live there too. This is the real test: it proves the broadcast reaches everyone connected, not just whoever clicked the button.

## Things worth knowing if you scale this up

Socket.IO is using its default in-memory adapter, and the "current telemetry reading" the mock generator tracks is just an in-memory variable — both are fine on a single instance but wouldn't work right across multiple instances without adding Redis. Same story for rate limiting, which is also tracked in-memory per instance. None of this matters at the scale a free Railway/Render tier runs at, just worth knowing before spinning up more than one instance.

Also — change the seeded demo credentials before sharing a deployed link publicly.
