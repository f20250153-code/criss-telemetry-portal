/**
 * Development seed data.
 *
 * IMPORTANT: the credentials below are for LOCAL DEVELOPMENT ONLY. They
 * are intentionally simple and documented in the README so anyone
 * cloning the repo can log in immediately. Never reuse these
 * credentials, or this seeding approach, for a production database.
 *
 * Uses `pg` directly rather than the generated Prisma Client — see
 * src/db/pool.ts for why.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { createId } from "@paralleldrive/cuid2";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SALT_ROUNDS = 12;

const DEV_USERS = [
  {
    name: "Vineet",
    email: "vineet@criss-robotics.dev",
    password: "Vineet@123!",
    role: "VIEWER" as const,
  },
  {
    name: "Biswajit",
    email: "biswajit@criss-robotics.dev",
    password: "Biswajit@123!",
    role: "ENGINEER" as const,
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

    console.log(`Seeded ${user.role} user: ${user.email}`);
  }

  console.log("\nDevelopment login credentials:");
  for (const user of DEV_USERS) {
    console.log(`  ${user.role.padEnd(9)} ${user.email}  /  ${user.password}`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
