/**
 * Applies pending migrations from apps/server/prisma/migrations/ directly
 * via `pg`, tracking applied migrations in `_prisma_migrations` — the
 * same table Prisma itself uses — so this stays compatible with (and
 * safely re-runnable alongside) the real `prisma migrate deploy`.
 *
 * This exists because `prisma migrate deploy` needs network access to
 * fetch its schema engine binary, which isn't guaranteed in every
 * deployment environment (see README "A note on Prisma in this repo").
 * docker-entrypoint.sh tries the real Prisma CLI first and only falls
 * back to this script if that fails.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const MIGRATIONS_DIR = path.join(import.meta.dirname, "..", "prisma", "migrations");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);

  const migrationDirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of migrationDirs) {
    const sqlPath = path.join(MIGRATIONS_DIR, name, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    const { rows } = await client.query(
      `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
      [name],
    );

    if (rows.length > 0) {
      console.log(`[migrate] skipping already-applied migration: ${name}`);
      continue;
    }

    console.log(`[migrate] applying: ${name}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES ($1, $2, now(), $3, 1)`,
        [randomUUID(), checksum, name],
      );
      await client.query("COMMIT");
      console.log(`[migrate] applied: ${name}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  await client.end();
  console.log("[migrate] all migrations up to date");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
