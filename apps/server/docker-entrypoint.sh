#!/bin/sh
set -e

echo "[entrypoint] waiting for database..."
node -e "
const { Client } = require('pg');
const maxAttempts = 30;
(async () => {
  for (let i = 1; i <= maxAttempts; i++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('[entrypoint] database is ready');
      return;
    } catch (err) {
      console.log('[entrypoint] database not ready (attempt ' + i + '/' + maxAttempts + '): ' + err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('[entrypoint] database never became ready');
  process.exit(1);
})();
"

echo "[entrypoint] applying migrations..."
if npx prisma migrate deploy --schema apps/server/prisma/schema.prisma > /tmp/prisma-migrate.log 2>&1; then
  echo "[entrypoint] migrations applied via Prisma CLI"
else
  echo "[entrypoint] Prisma CLI unavailable in this environment (see /tmp/prisma-migrate.log) — applying migrations directly instead"
  node apps/server/scripts/apply-migrations.mjs
fi

echo "[entrypoint] seeding development accounts (safe to re-run, idempotent)..."
node apps/server/scripts/seed.mjs

echo "[entrypoint] starting server"
exec node apps/server/dist/index.js
