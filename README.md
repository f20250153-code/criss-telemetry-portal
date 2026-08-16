# Rover Telemetry Portal

A real-time telemetry dashboard for a rover drive team, built for the CRISS
Robotics Full-Stack recruitment task. Engineers can trigger and view live
rover telemetry (battery voltage, temperature, rover state); viewers get
read-only dashboard access. Built as a TypeScript monorepo with a Next.js
frontend and an Express + Socket.IO backend.

> **Status:** foundation phase. Auth, the database, and real-time telemetry
> are implemented in later phases — see [Roadmap](#roadmap) below.

## Architecture

```
telemetry-portal/
├── apps/
│   ├── web/          Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
│   └── server/        Node.js + Express + TypeScript
├── packages/
│   └── shared/         Shared TypeScript types/contracts used by both apps
├── docker-compose.yml   (added Phase 10)
└── package.json         npm workspaces root
```

- **Frontend** (`apps/web`) — Next.js App Router, Tailwind CSS v4, a small
  hand-rolled shadcn/ui component foundation (`src/components/ui`), Zustand
  for global state (added Phase 5), Recharts for live charts (added Phase 6).
- **Backend** (`apps/server`) — Express REST API with a centralized error
  handler, PostgreSQL via Prisma (added Phase 2), JWT auth (added Phase 3),
  and Socket.IO for real-time telemetry (added Phase 4).
- **Shared** (`packages/shared`) — TypeScript types and Socket.IO event
  contracts imported by both apps so the wire format can never drift out of
  sync between frontend and backend.

The backend is the only source of authorization truth. The frontend's role
checks are UX convenience, never a security boundary — every
engineer-only action is re-validated server-side.

### A note on Prisma in this repo

`apps/server/prisma/schema.prisma` and `prisma/migrations/` are the real,
authoritative schema and migration history, exactly as the recruitment
brief specifies. The database was created by applying that migration.

The runtime query layer (`src/repositories/`), however, uses `pg`
directly rather than the generated `@prisma/client`. That's a narrow,
deliberate substitution made because this project was developed in a
sandbox that cannot reach `binaries.prisma.sh` — every `prisma` CLI
invocation, including `--version`, needs that host to fetch its schema
engine, so `prisma generate` could not run there. On a machine with
normal internet access:

```bash
cd apps/server
npx prisma generate
```

produces a fully typed `@prisma/client` in seconds. Swapping the
repository functions to call it instead of raw SQL is a mechanical,
low-risk change — every query in `src/repositories/` is a direct,
intentional analogue of the equivalent Prisma Client call.

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10 (workspaces)
- PostgreSQL ≥ 14 (added Phase 2 — not required yet)
- Docker + Docker Compose (added Phase 10 — not required yet)

## Local setup

```bash
# from the repo root
npm install
# ^ postinstall automatically builds packages/shared, since apps/server
#   and apps/web both import types from it

# copy env templates
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local

# create the database and apply the schema (adjust DATABASE_URL first)
createdb telemetry_portal
psql "$DATABASE_URL" -f apps/server/prisma/migrations/20260816120000_init/migration.sql

# seed development accounts
npm run db:seed --workspace=apps/server
```

### Development login credentials

Seeded by `npm run db:seed --workspace=apps/server` — local development
only, never used in any deployed environment:

| Role | Email | Password |
|---|---|---|
| Viewer | `viewer@criss-robotics.dev` | `ViewerDev123!` |
| Engineer | `engineer@criss-robotics.dev` | `EngineerDev123!` |

## Development commands

Run from the repo root (npm workspaces):

| Command | Description |
|---|---|
| `npm run dev:server` | Start the backend in watch mode on `:4000` |
| `npm run dev:web` | Start the Next.js dev server on `:3000` |
| `npm run build` | Build `shared` → `server` → `web`, in order |
| `npm run typecheck` | Type-check every workspace |
| `npm run lint` | Lint `web` and `server` |
| `npm run test` | Run backend tests (Vitest + Supertest) |

Verify the backend is up:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

## Environment variables

### `apps/server/.env`

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` | No (defaults to `development`) |
| `PORT` | Port the API listens on | No (defaults to `4000`) |
| `CORS_ORIGIN` | Exact origin of the frontend, used for CORS (and Socket.IO from Phase 4) | No (defaults to `http://localhost:3000`) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret used to sign JWTs — **never commit a real value** | Added Phase 3 |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` | Added Phase 3 |

### `apps/web/.env.local`

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend REST API | Yes |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL for the Socket.IO connection | Added Phase 4 |

No secrets are committed to source control — see `.gitignore`. Every
variable above is documented in the corresponding `.env.example` file.

## API reference

All responses use the envelope `{ "success": true, "data": ... }` or
`{ "success": false, "error": { "message", "code" } }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | none | Liveness check |
| `GET` | `/health/db` | none | Readiness check — confirms Postgres connectivity |
| `POST` | `/auth/login` | none | `{ email, password }` → `{ user, token }` |
| `GET` | `/auth/me` | Bearer token | Returns the current authenticated user |

Status codes: `400` invalid input, `401` missing/invalid/expired token
or bad credentials, `403` authenticated but wrong role, `404` unknown
route, `500` unexpected error. `/auth/login` returns the same `401` +
`INVALID_CREDENTIALS` code for both "no such user" and "wrong
password" so the response never discloses which one it was.

## Roadmap

| Phase | Scope |
|---|---|
| 1 ✅ | Monorepo foundation |
| 2 ✅ | PostgreSQL + Prisma schema |
| 3 ✅ | JWT authentication + RBAC |
| 4 | Socket.IO real-time telemetry backend |
| 5 | Frontend auth + Zustand store |
| 6 | Live telemetry dashboard |
| 7 | Engineer control panel |
| 8 | UI polish |
| 9 | Security audit + full test coverage |
| 10 | Dockerization |
| 11 | Deployment |
| 12 | Final submission audit |

## License

Built for a CRISS Robotics recruitment task. No license specified.
