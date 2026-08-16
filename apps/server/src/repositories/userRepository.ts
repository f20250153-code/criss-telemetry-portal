import type { Role } from "@telemetry/shared";
import { pool } from "../db/pool";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return row;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query(
    `SELECT id, name, email, "passwordHash", role, "createdAt", "updatedAt"
     FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query(
    `SELECT id, name, email, "passwordHash", role, "createdAt", "updatedAt"
     FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}): Promise<UserRecord> {
  const result = await pool.query(
    `INSERT INTO users (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now())
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email, "passwordHash", role, "createdAt", "updatedAt"`,
    [input.id, input.name, input.email, input.passwordHash, input.role],
  );
  return mapRow(result.rows[0]);
}
