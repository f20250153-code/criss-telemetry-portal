import { z } from "zod";
import { ROVER_STATES, TELEMETRY_BOUNDS, type RoverState } from "@telemetry/shared";

const roverStateTuple = ROVER_STATES as [RoverState, ...RoverState[]];

export const triggerTelemetrySchema = z.object({
  batteryVoltage: z
    .number()
    .min(TELEMETRY_BOUNDS.batteryVoltage.min)
    .max(TELEMETRY_BOUNDS.batteryVoltage.max)
    .optional(),
  temperature: z
    .number()
    .min(TELEMETRY_BOUNDS.temperature.min)
    .max(TELEMETRY_BOUNDS.temperature.max)
    .optional(),
  state: z.enum(roverStateTuple).optional(),
});

export type TriggerTelemetryBody = z.infer<typeof triggerTelemetrySchema>;
