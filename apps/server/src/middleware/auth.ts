import type { NextFunction, Request, Response } from "express";
import type { Role } from "@telemetry/shared";
import { AppError } from "../utils/AppError";
import { verifyAuthToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

/**
 * Verifies the Bearer token on the request and attaches the identity
 * it encodes to `req.user`. This is the ONLY place a request's role is
 * ever derived — every downstream handler trusts `req.user.role`
 * because it came from a signed, server-issued token, never from a
 * client-supplied field.
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(AppError.unauthorized("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    next(AppError.unauthorized("Invalid or expired token"));
    return;
  }

  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
}

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 * Returns 403 (not 401) — the caller IS authenticated, they just don't
 * have permission for this action.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden(`This action requires one of: ${allowedRoles.join(", ")}`));
      return;
    }
    next();
  };
}
