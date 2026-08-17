import rateLimit from "express-rate-limit";
import type { ApiError } from "@telemetry/shared";

/**
 * Limits login attempts per IP. This is the mitigation for
 * brute-force credential guessing that complements — never replaces —
 * bcrypt hashing and constant-time comparison in authService.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ApiError = {
      success: false,
      error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" },
    };
    res.status(429).json(body);
  },
});
