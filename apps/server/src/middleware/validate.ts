import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Validates `req.body` against a zod schema and replaces it with the
 * parsed (trimmed/coerced) result. Any validation failure becomes a
 * 400 with the first issue's message — consistent with the rest of
 * the app's error envelope, no per-route try/catch needed.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      next(AppError.badRequest(firstIssue?.message ?? "Invalid request body", "VALIDATION_ERROR"));
      return;
    }
    req.body = result.data;
    next();
  };
}
