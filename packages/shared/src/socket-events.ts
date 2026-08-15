import type { TelemetryPayload } from "./telemetry";

/**
 * Canonical Socket.IO event names shared between client and server so
 * both sides always agree on the wire contract.
 */
export const SOCKET_EVENTS = {
  TELEMETRY_UPDATE: "telemetry:update",
  TELEMETRY_HISTORY: "telemetry:history",
  CONNECTION_ERROR: "connection:error",
} as const;

export interface ServerToClientEvents {
  [SOCKET_EVENTS.TELEMETRY_UPDATE]: (payload: TelemetryPayload) => void;
  [SOCKET_EVENTS.TELEMETRY_HISTORY]: (payload: TelemetryPayload[]) => void;
  [SOCKET_EVENTS.CONNECTION_ERROR]: (payload: { message: string }) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {
  // The client currently only receives telemetry; manual triggers go
  // through the authenticated REST endpoint so authorization is easy to
  // audit in one place. Reserved for future client-initiated events.
}
