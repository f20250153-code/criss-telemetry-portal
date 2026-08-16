"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS, type TelemetryPayload } from "@telemetry/shared";
import { useAuthStore } from "@/stores/authStore";
import { useTelemetryStore } from "@/stores/telemetryStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

/**
 * Opens exactly one authenticated Socket.IO connection for the
 * lifetime of the dashboard and tears it down on unmount — no
 * polling, no duplicate connections across re-renders, no listeners
 * left dangling after logout/navigation.
 */
export function useTelemetrySocket() {
  const token = useAuthStore((s) => s.token);
  const { setHistory, pushReading, setConnectionStatus, setError, reset } = useTelemetryStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    setConnectionStatus("connecting");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setError(null);
    });

    socket.on(SOCKET_EVENTS.TELEMETRY_HISTORY, (readings: TelemetryPayload[]) => {
      setHistory(readings);
    });

    socket.on(SOCKET_EVENTS.TELEMETRY_UPDATE, (reading: TelemetryPayload) => {
      pushReading(reading);
    });

    socket.on(SOCKET_EVENTS.CONNECTION_ERROR, (payload: { message: string }) => {
      setError(payload.message);
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      setConnectionStatus("error");
      setError(err.message === "UNAUTHORIZED" ? "Session expired — please log in again." : err.message);
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
}
