# Rover Telemetry Portal

A real-time telemetry dashboard for a rover drive team, built for the CRISS Robotics full-stack recruitment task. Viewers can watch live telemetry — battery, temperature, rover state. Engineers get an extra panel to manually trigger a reading, which streams out to everyone connected over a WebSocket the moment it happens.

**Live app:** https://criss-telemetry-portal.vercel.app
**API:** https://criss-telemetry-portal-production.up.railway.app

## Stack

- **Frontend** — Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Zustand, Recharts
- **Backend** — Node.js, Express, Socket.IO, PostgreSQL, JWT auth
- **Infra** — Docker, Vercel (frontend), Railway (backend + Postgres)

npm workspaces monorepo:

```
apps/
  web/       Next.js frontend
  server/    Express + Socket.IO backend
packages/
  shared/    types and socket event contracts shared by both apps
```

Authorization lives entirely on the backend. The frontend hides the engineer panel from viewers for UX reasons, but that's not what actually stops them — the trigger endpoint checks the role on the server too, so a viewer's token can't call it no matter what the UI shows.

## Running it locally

```bash
npm install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local

createdb telemetry_portal
psql "$DATABASE_URL" -f apps/server/prisma/migrations/20260816120000_init/migration.sql
npm run db:seed --workspace=apps/server

npm run dev:server   # http://localhost:4000
npm run dev:web      # http://localhost:3000
```

Seeded accounts for local dev (don't reuse these anywhere real):

| Role | Email | Password |
|---|---|---|
| Viewer | `vineet@criss-robotics.dev` | `Vineet@123!` |
| Engineer | `biswajit@criss-robotics.dev` | `Biswajit@123!` |

Or skip the manual setup and run everything in Docker — copy `.env.example` to `.env` at the repo root, fill in a `JWT_SECRET`, then:

```bash
docker compose up --build
```

This starts Postgres, the backend, and the frontend together. The backend waits for Postgres to be healthy before starting, and applies migrations on its own at boot.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev:server` / `dev:web` | run the dev servers |
| `npm run build` | build shared → server → web |
| `npm run typecheck` | type-check every workspace |
| `npm run lint` | lint web + server |
| `npm run test` | run the backend test suite (Vitest + Supertest) |

## Environment variables

**`apps/server/.env`**

| Variable | What it's for | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | yes |
| `JWT_SECRET` | signs auth tokens — generate your own, never commit a real one | yes |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `1h` | no, defaults to `1h` |
| `CORS_ORIGIN` | exact frontend origin, used for CORS and Socket.IO | no, defaults to `http://localhost:3000` |
| `NODE_ENV` | `development` / `test` / `production` | no |
| `PORT` | port the API listens on | no, defaults to `4000` |

**`apps/web/.env.local`**

| Variable | What it's for | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | backend base URL | yes |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO base URL | yes |

Nothing real is committed anywhere — check `.gitignore`. Both `.env.example` files spell out the full list.

## API

Everything responds with `{ success: true, data }` or `{ success: false, error }`.

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/health` | — | liveness check |
| GET | `/health/db` | — | confirms Postgres is reachable |
| POST | `/auth/login` | — | `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | token | current user |
| GET | `/telemetry/history` | token | recent readings |
| POST | `/telemetry/trigger` | token, engineer only | generates a reading and broadcasts it; you can optionally pass `batteryVoltage`, `temperature`, `state` and it'll still clamp/validate them server-side |

Socket.IO runs alongside the REST API on the same server. A connection needs a JWT in the handshake — there's no anonymous socket access. Right after connecting you get `telemetry:history`; every trigger after that broadcasts `telemetry:update` to every connected client. Nothing polls.

To watch it live from the command line:

```bash
# get a token
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"biswajit@criss-robotics.dev","password":"Biswajit@123!"}'

# in one terminal
node apps/server/scripts/verify-socket.mjs <jwt>

# in another, trigger a reading and watch it show up above instantly
curl -X POST http://localhost:4000/telemetry/trigger \
  -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d '{}'
```

A few things worth knowing about the auth: login is rate-limited (20 attempts per 15 minutes per IP), and an unknown email and a wrong password both come back as the same 401 — nothing in the response tells you which one it was, so there's no way to enumerate accounts by trying logins.

Full write-up of what got checked in the security pass — auth, input validation, SQL injection, CORS, the works — is in [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md).

## Deploying your own copy

Step-by-step for Vercel + Railway or Render: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). `railway.json` and `render.yaml` are already in the repo and both reuse the same Dockerfiles as local Docker Compose.

## A note on Prisma

`apps/server/prisma/schema.prisma` and the migration under `prisma/migrations/` are the real schema and migration history — the database was built by applying that migration, same as Prisma itself would do.

Where it's a bit different: the actual queries at runtime (`src/repositories/`) go through `pg` directly instead of the generated Prisma Client. This project was built somewhere without network access to Prisma's engine-binary CDN, so `prisma generate` had nowhere to fetch from. On any normal machine, running

```bash
cd apps/server
npx prisma generate
```

produces a fully typed Prisma Client in a few seconds, and swapping the repository functions over to use it instead of raw SQL is a small, mechanical change — every query already mirrors exactly what the equivalent Prisma call would do.

## License

Built for a CRISS Robotics recruitment task. No license specified.
