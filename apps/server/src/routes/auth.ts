import { Router } from "express";
import type { ApiResult, PublicUser } from "@telemetry/shared";
import { login } from "../services/authService";
import { loginSchema, type LoginInput } from "../validation/authSchemas";
import { validateBody } from "../middleware/validate";
import { loginRateLimiter } from "../middleware/rateLimit";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { findUserById } from "../repositories/userRepository";
import { AppError } from "../utils/AppError";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await login(email, password);

    const body: ApiResult<{ user: PublicUser; token: string }> = {
      success: true,
      data: result,
    };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});

// Protected route: proves the authenticate middleware and token
// round-trip work end to end, and gives the frontend a way to
// rehydrate the current user from a stored token.
authRouter.get("/me", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const user = await findUserById(req.user.id);
    if (!user) {
      throw AppError.unauthorized("User no longer exists");
    }

    const body: ApiResult<PublicUser> = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});
