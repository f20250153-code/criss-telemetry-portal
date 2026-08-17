/**
 * Development seed data — see apps/server/prisma/seed.ts for the
 * canonical TypeScript version this mirrors.
 *
 * This plain-JS copy exists so it can run automatically inside the
 * deployed container on every startup (via docker-entrypoint.sh),
 * using the runtime image's already-verified DATABASE_URL — no local
 * network access to the database from a developer's machine required.
 * It's safe to run on every deploy: ON CONFLICT means existing users
 * are left alone (password hash refreshed to the known dev value,
 * nothing duplicated).
 *
 * IMPORTANT: these credentials are for evaluation/demo purposes only.
 * Never reuse this seeding approach for a real production database
 * with real user data.
 */
import bcrypt from "bcrypt";
import pg from "pg";
import { createId } from "@paralleldrive/cuid2";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SALT_ROUNDS = 12;

const DEV_USERS = [
  {
    name: "Dana Viewer",
    email: "viewer@criss-robotics.dev",
    password: "ViewerDev123!",
    role: "VIEWER",
  },
  {
    name: "Erin Engineer",
    email: "engineer@criss-robotics.dev",
    password: "EngineerDev123!",
    role: "ENGINEER",
  },
];

async function main() {
  for (const user of DEV_USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now(), now())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      [createId(), user.name, user.email, passwordHash, user.role],
    );

    console.log(`[seed] ${user.role} user ready: ${user.email}`);
  }
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err.message);
    // Non-fatal: don't crash the whole container if seeding has an
    // issue — the app itself doesn't depend on these accounts existing.
  })
  .finally(async () => {
    await pool.end();
  });
