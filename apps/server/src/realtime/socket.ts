import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Role } from "@telemetry/shared";
import { SOCKET_EVENTS } from "@telemetry/shared";
import { env } from "../config/env";
import { verifyAuthToken } from "../utils/jwt";
import { getTelemetryHistory } from "../services/telemetryService";

export interface SocketUser {
  id: string;
  email: string;
  role: Role;
}

function getSocketUser(socket: { data: unknown }): SocketUser {
  return (socket.data as { user: SocketUser }).user;
}

/**
 * Creates and wires the Socket.IO server. Connections must present a
 * valid JWT in the handshake — there is no anonymous or unauthenticated
 * socket access, matching the REST API's security posture exactly.
 */
export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("UNAUTHORIZED"));
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      next(new Error("UNAUTHORIZED"));
      return;
    }

    socket.data.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  });

  io.on("connection", (socket) => {
    const { email, role } = getSocketUser(socket);
    // eslint-disable-next-line no-console
    console.log(`[socket] connected: ${email} (${role}) — ${socket.id}`);

    // Send recent history immediately so the dashboard has something
    // to chart before the next live update arrives.
    getTelemetryHistory()
      .then((history) => socket.emit(SOCKET_EVENTS.TELEMETRY_HISTORY, history))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[socket] failed to load telemetry history:", err);
        socket.emit(SOCKET_EVENTS.CONNECTION_ERROR, { message: "Failed to load telemetry history" });
      });

    socket.on("disconnect", (reason) => {
      // eslint-disable-next-line no-console
      console.log(`[socket] disconnected: ${email} — ${socket.id} (${reason})`);
    });

    socket.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error(`[socket] error for ${email}:`, err);
    });
  });

  io.engine.on("connection_error", (err) => {
    // eslint-disable-next-line no-console
    console.warn(`[socket] rejected connection: ${err.message}`);
  });

  return io;
}
