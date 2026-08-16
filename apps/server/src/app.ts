import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { exampleRouter } from "./routes/example";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/**
 * Builds the Express application without starting it. Kept separate
 * from src/index.ts so tests can import the app and drive it with
 * supertest without binding a real port or opening a socket server.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/example", exampleRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
