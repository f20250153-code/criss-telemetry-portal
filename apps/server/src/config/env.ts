import "dotenv/config";

/**
 * Centralized, validated environment configuration.
 *
 * Every environment variable the server depends on is read exactly once,
 * here, so a missing/invalid value fails fast at startup instead of
 * surfacing as a confusing runtime error later.
 */

interface EnvConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsOrigin: string;
  databaseUrl: string;
}

function readNodeEnv(): EnvConfig["nodeEnv"] {
  const value = process.env.NODE_ENV;
  if (value === "production" || value === "test") return value;
  return "development";
}

function readPort(): number {
  const raw = process.env.PORT;
  const parsed = raw ? Number(raw) : 4000;
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT environment variable: "${raw}"`);
  }
  return parsed;
}

function readCorsOrigin(): string {
  return process.env.CORS_ORIGIN ?? "http://localhost:3000";
}

function readDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  return value;
}

export const env: EnvConfig = {
  nodeEnv: readNodeEnv(),
  port: readPort(),
  corsOrigin: readCorsOrigin(),
  databaseUrl: readDatabaseUrl(),
};
