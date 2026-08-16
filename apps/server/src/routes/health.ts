import { Router } from "express";
import { checkDatabaseConnection } from "../db/pool";

export const healthRouter = Router();

// Plain liveness check — deliberately does NOT touch the database, so
// it stays fast and reflects "the process is up" regardless of DB state.
healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Readiness check — confirms the API can actually reach Postgres.
healthRouter.get("/db", async (_req, res) => {
  const isConnected = await checkDatabaseConnection();
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? "ok" : "unavailable",
    database: isConnected ? "connected" : "unreachable",
  });
});
