import bcrypt from "bcrypt";
import type { PublicUser } from "@telemetry/shared";
import { findUserByEmail } from "../repositories/userRepository";
import { signAuthToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export interface LoginResult {
  user: PublicUser;
  token: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: PublicUser["role"];
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Verifies credentials and issues a JWT. Deliberately uses the SAME
 * error message/status for "no such user" and "wrong password" so the
 * response never discloses which one it was.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Constant-ish time: run bcrypt against a dummy hash so a timing
    // attack can't distinguish "no such user" from "wrong password".
    await bcrypt.compare(password, "$2b$12$invalidsaltinvalidsaltinvalidsalOK7X8Z8vXK6Xu6gk9dG3G");
    throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });

  return { user: toPublicUser(user), token };
}
