import type { NextFunction, Request, Response } from "express";
import type { ApiError } from "@telemetry/shared";
import { AppError } from "../utils/AppError";

/**
 * Catches requests that didn't match any route and turns them into a
 * consistent 404 AppError so they flow through the same error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

/**
 * Single place where every thrown error becomes an HTTP response.
 * Must be registered last, after all routes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const appError = err instanceof AppError ? err : AppError.internal();

  // Never leak internal error details/stack traces to the client.
  if (!(err instanceof AppError)) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error:", err);
  }

  const body: ApiError = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
    },
  };

  res.status(appError.statusCode).json(body);
}
