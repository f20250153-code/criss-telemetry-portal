import type { RoverState } from "@telemetry/shared";
import { pool } from "../db/pool";

export interface TelemetryRecord {
  id: string;
  batteryVoltage: number;
  temperature: number;
  state: RoverState;
  timestamp: Date;
  triggeredById: string | null;
}

export async function createTelemetryReading(input: {
  id: string;
  batteryVoltage: number;
  temperature: number;
  state: RoverState;
  triggeredById?: string | null;
}): Promise<TelemetryRecord> {
  const result = await pool.query(
    `INSERT INTO telemetry_readings (id, "batteryVoltage", temperature, state, timestamp, "triggeredById")
     VALUES ($1, $2, $3, $4, now(), $5)
     RETURNING id, "batteryVoltage", temperature, state, timestamp, "triggeredById"`,
    [input.id, input.batteryVoltage, input.temperature, input.state, input.triggeredById ?? null],
  );
  return result.rows[0];
}

export async function findRecentTelemetry(limit = 50): Promise<TelemetryRecord[]> {
  const result = await pool.query(
    `SELECT id, "batteryVoltage", temperature, state, timestamp, "triggeredById"
     FROM telemetry_readings
     ORDER BY timestamp DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.reverse();
}
