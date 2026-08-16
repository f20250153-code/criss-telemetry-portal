import {
  ROVER_STATES,
  TELEMETRY_BOUNDS,
  type RoverState,
  type TelemetryPayload,
  type TriggerTelemetryInput,
} from "@telemetry/shared";
import { createTelemetryReading, findRecentTelemetry } from "../repositories/telemetryRepository";
import { generateId } from "../utils/id";

interface TelemetryState {
  batteryVoltage: number;
  temperature: number;
  state: RoverState;
}

// Sensible baseline for a rover sitting idle at the start of a session.
let current: TelemetryState = { batteryVoltage: 28.4, temperature: 24, state: "IDLE" };
let initialized = false;

// Natural state transitions only — a rover doesn't jump from IDLE to
// ESTOP without passing through an active state first. Weighted toward
// staying put so the feed doesn't flicker unrealistically.
const TRANSITIONS: Record<RoverState, RoverState[]> = {
  IDLE: ["IDLE", "IDLE", "IDLE", "DRIVING", "CHARGING"],
  DRIVING: ["DRIVING", "DRIVING", "DRIVING", "IDLE", "FAULT"],
  CHARGING: ["CHARGING", "CHARGING", "IDLE"],
  FAULT: ["FAULT", "IDLE"],
  ESTOP: ["ESTOP", "IDLE"],
};

function clamp(value: number, bounds: { min: number; max: number }): number {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

/** Small bounded step from the previous value — avoids unrealistic jumps. */
function randomWalk(value: number, maxDelta: number, bounds: { min: number; max: number }): number {
  const delta = (Math.random() * 2 - 1) * maxDelta;
  return Number(clamp(value + delta, bounds).toFixed(2));
}

function nextState(previous: RoverState): RoverState {
  const options = TRANSITIONS[previous];
  return options[Math.floor(Math.random() * options.length)] ?? previous;
}

/** Loads the most recent DB reading as the starting point, if one exists. */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  const recent = await findRecentTelemetry(1);
  const last = recent[0];
  if (last) {
    current = { batteryVoltage: last.batteryVoltage, temperature: last.temperature, state: last.state };
  }
  initialized = true;
}

function toPayload(record: {
  id: string;
  batteryVoltage: number;
  temperature: number;
  state: RoverState;
  timestamp: Date;
}): TelemetryPayload {
  return {
    id: record.id,
    batteryVoltage: record.batteryVoltage,
    temperature: record.temperature,
    state: record.state,
    timestamp: record.timestamp.toISOString(),
  };
}

/**
 * Generates the next telemetry reading, persists it, and returns it
 * ready to broadcast. Any field the caller supplies overrides the
 * random walk for that field, but is still clamped to
 * TELEMETRY_BOUNDS/ROVER_STATES — never trusted blindly, even from an
 * already-authorized engineer.
 */
export async function generateTelemetryReading(
  overrides: TriggerTelemetryInput = {},
  triggeredById: string | null = null,
): Promise<TelemetryPayload> {
  await ensureInitialized();

  const batteryVoltage =
    overrides.batteryVoltage !== undefined
      ? clamp(overrides.batteryVoltage, TELEMETRY_BOUNDS.batteryVoltage)
      : randomWalk(current.batteryVoltage, 0.6, TELEMETRY_BOUNDS.batteryVoltage);

  const temperature =
    overrides.temperature !== undefined
      ? clamp(overrides.temperature, TELEMETRY_BOUNDS.temperature)
      : randomWalk(current.temperature, 1.2, TELEMETRY_BOUNDS.temperature);

  const state =
    overrides.state && ROVER_STATES.includes(overrides.state) ? overrides.state : nextState(current.state);

  current = { batteryVoltage, temperature, state };

  const saved = await createTelemetryReading({
    id: generateId(),
    batteryVoltage,
    temperature,
    state,
    triggeredById,
  });

  return toPayload(saved);
}

export async function getTelemetryHistory(limit = 50): Promise<TelemetryPayload[]> {
  const rows = await findRecentTelemetry(limit);
  return rows.map(toPayload);
}
