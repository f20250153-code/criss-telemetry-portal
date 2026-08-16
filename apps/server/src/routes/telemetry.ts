import { Router } from "express";
import type { Server as SocketIOServer } from "socket.io";
import { SOCKET_EVENTS, type ApiResult, type TelemetryPayload } from "@telemetry/shared";
import { authenticate, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { triggerTelemetrySchema, type TriggerTelemetryBody } from "../validation/telemetrySchemas";
import { generateTelemetryReading, getTelemetryHistory } from "../services/telemetryService";

export const telemetryRouter = Router();

// Any authenticated user (viewer or engineer) can read history — used
// to backfill the dashboard chart on load, before any live update has
// arrived over the socket.
telemetryRouter.get("/history", authenticate, async (_req, res, next) => {
  try {
    const history = await getTelemetryHistory();
    const body: ApiResult<TelemetryPayload[]> = { success: true, data: history };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});

// Engineer-only. The UI hides this control from viewers, but that's
// convenience, not security — requireRole is what actually blocks a
// viewer (or a viewer with a hand-edited request) from calling it.
telemetryRouter.post(
  "/trigger",
  authenticate,
  requireRole("ENGINEER"),
  validateBody(triggerTelemetrySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const overrides = req.body as TriggerTelemetryBody;
      const reading = await generateTelemetryReading(overrides, req.user?.id ?? null);

      const io: SocketIOServer | undefined = req.app.locals.io;
      io?.emit(SOCKET_EVENTS.TELEMETRY_UPDATE, reading);

      const body: ApiResult<TelemetryPayload> = { success: true, data: reading };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);
