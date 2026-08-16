import { create } from "zustand";
import type { TelemetryPayload } from "@telemetry/shared";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

const MAX_HISTORY = 50;

interface TelemetryState {
  current: TelemetryPayload | null;
  history: TelemetryPayload[];
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: string | null;
  error: string | null;

  setHistory: (readings: TelemetryPayload[]) => void;
  pushReading: (reading: TelemetryPayload) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  current: null,
  history: [],
  connectionStatus: "connecting",
  lastUpdatedAt: null,
  error: null,

  setHistory: (readings) =>
    set({
      history: readings.slice(-MAX_HISTORY),
      current: readings.length > 0 ? (readings[readings.length - 1] ?? null) : null,
    }),

  pushReading: (reading) =>
    set((state) => ({
      current: reading,
      history: [...state.history, reading].slice(-MAX_HISTORY),
      lastUpdatedAt: reading.timestamp,
    })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setError: (message) => set({ error: message }),

  reset: () =>
    set({
      current: null,
      history: [],
      connectionStatus: "connecting",
      lastUpdatedAt: null,
      error: null,
    }),
}));
