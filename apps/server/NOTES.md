# Telemetry Portal

Monorepo (npm workspaces): `apps/web` (Next.js 16 + TypeScript + Tailwind +
Zustand + Recharts), `apps/server` (Express + TypeScript + Socket.io + JWT +
Prisma/Postgres), `packages/shared` (shared TS types/socket-event contracts
used by both apps).

Auth: JWT in `socket.handshake.auth.token`, validated in `io.use()`
middleware (`apps/server/src/realtime/socket.ts`).
Roles: viewer, engineer — engineer-only actions (`POST /telemetry/trigger`)
are re-checked server-side from the verified JWT payload
(`apps/server/src/middleware/auth.ts`), never trusted from the client
payload.

Seed users (via `npm run db:seed --workspace=apps/server`, see
`apps/server/prisma/seed.ts`): viewer@criss-robotics.dev / ViewerDev123!,
engineer@criss-robotics.dev / EngineerDev123!.

Run (from repo root):
  npm install                 # postinstall builds packages/shared
  npm run dev:server          # http://localhost:4000
  npm run dev:web             # http://localhost:3000

Env:
  apps/server/.env: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, PORT
  apps/web/.env.local: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL

Tests: npm run test --workspace=apps/server (Vitest + Supertest).
Full command reference and deployment docs: see README.md and
docs/DEPLOYMENT.md.

Design tokens live in apps/web/src/app/globals.css as Tailwind v4 CSS
custom properties — reuse them rather than hardcoding colors in new
components.

Note: this repo used to contain a standalone prototype at top-level
/client and /server, superseded by the apps/web + apps/server monorepo
above. If you see those folders, they're stale — do not treat them as
part of the active app.
