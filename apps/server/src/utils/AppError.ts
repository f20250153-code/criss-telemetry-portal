/**
 * Operational error with an explicit HTTP status and machine-readable
 * code. Throw this (or a subclass) anywhere in route/service code and
 * the central error handler will translate it into a consistent JSON
 * response — no route needs its own try/catch formatting logic.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational = true;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST"): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED"): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "You do not have access to this resource", code = "FORBIDDEN"): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
    return new AppError(message, 404, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR"): AppError {
    return new AppError(message, 500, code);
  }
}
