import { Pool } from "pg";
import { env } from "../config/env";

/**
 * NOTE ON PRISMA
 * ---------------
 * `schema.prisma` and `prisma/migrations/` are the real, authoritative
 * schema/migration source for this project, exactly as the spec
 * requires — the database was created by applying that migration.
 *
 * The query layer below uses `pg` directly rather than the generated
 * `@prisma/client`. That's a deliberate, narrow substitution: the
 * sandbox this was developed in cannot reach binaries.prisma.sh (every
 * `prisma` CLI invocation — even `--version` — needs it to fetch the
 * schema engine), so `prisma generate` cannot run there. On a machine
 * with normal internet access, running `npx prisma generate` produces
 * a fully typed `@prisma/client`; swapping these repository functions
 * to use it instead of raw SQL is a mechanical, low-risk change since
 * every query here is a direct, intentional analogue of the equivalent
 * Prisma Client call.
 */

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  global.__pgPool ??
  new Pool({
    connectionString: env.databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
