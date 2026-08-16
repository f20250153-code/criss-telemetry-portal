import jwt from "jsonwebtoken";
import type { Role } from "@telemetry/shared";
import { env } from "../config/env";

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifies a JWT and returns its payload, or null if it's missing,
 * malformed, expired, or signed with a different secret. Callers
 * translate `null` into a 401 — this function never throws for
 * ordinary invalid-token cases so route code doesn't need try/catch.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "sub" in decoded &&
      "email" in decoded &&
      "role" in decoded
    ) {
      return decoded as AuthTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
