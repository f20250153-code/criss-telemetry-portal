import { Router } from "express";
import type { ApiResult } from "@telemetry/shared";
import { authenticate, requireRole, type AuthenticatedRequest } from "../middleware/auth";

export const exampleRouter = Router();

// Any authenticated user (viewer or engineer).
exampleRouter.get("/dashboard-ping", authenticate, (req: AuthenticatedRequest, res) => {
  const body: ApiResult<{ message: string }> = {
    success: true,
    data: { message: `Hello ${req.user?.role.toLowerCase()}, dashboard access confirmed.` },
  };
  res.status(200).json(body);
});

// Engineer-only — proves requireRole rejects viewers with 403, not
// just hides a button. Phase 4 replaces this with the real telemetry
// trigger endpoint using the identical authenticate + requireRole
// pattern.
exampleRouter.get(
  "/engineer-ping",
  authenticate,
  requireRole("ENGINEER"),
  (_req: AuthenticatedRequest, res) => {
    const body: ApiResult<{ message: string }> = {
      success: true,
      data: { message: "Hello engineer, engineer-only access confirmed." },
    };
    res.status(200).json(body);
  },
);
