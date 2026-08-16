"use client";

import { useState, type FormEvent } from "react";
import { Wrench, Loader2, CheckCircle2 } from "lucide-react";
import { ROVER_STATES, type RoverState } from "@telemetry/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

/**
 * Rendered only when `user.role === "ENGINEER"` — see DashboardContent.
 * That check is UX convenience only. The real boundary is the
 * backend's `requireRole("ENGINEER")` on POST /telemetry/trigger,
 * which rejects this exact request from a viewer even if someone
 * called the endpoint directly with a viewer's token.
 */
export function EngineerPanel() {
  const token = useAuthStore((s) => s.token);
  const [batteryVoltage, setBatteryVoltage] = useState("");
  const [temperature, setTemperature] = useState("");
  const [state, setState] = useState<RoverState | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const body: Record<string, number | RoverState> = {};
    if (batteryVoltage.trim() !== "") body.batteryVoltage = Number(batteryVoltage);
    if (temperature.trim() !== "") body.temperature = Number(temperature);
    if (state !== "") body.state = state;

    try {
      await apiFetch("/telemetry/trigger", { method: "POST", body, token });
      setSuccess("Telemetry reading generated and broadcast.");
      setBatteryVoltage("");
      setTemperature("");
      setState("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to trigger telemetry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex-row items-center gap-2 space-y-0 p-4 pb-0">
        <Wrench className="h-4 w-4 text-primary" />
        <div>
          <CardTitle className="text-sm font-medium">Engineer controls</CardTitle>
          <CardDescription>Manually trigger a mock telemetry update</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="battery-input" className="text-xs">
              Battery (V) — optional
            </Label>
            <Input
              id="battery-input"
              type="number"
              step="0.1"
              placeholder="auto"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(e.target.value)}
              disabled={isSubmitting}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="temp-input" className="text-xs">
              Temp (°C) — optional
            </Label>
            <Input
              id="temp-input"
              type="number"
              step="0.1"
              placeholder="auto"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              disabled={isSubmitting}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state-select" className="text-xs">
              Rover state — optional
            </Label>
            <select
              id="state-select"
              value={state}
              onChange={(e) => setState(e.target.value as RoverState | "")}
              disabled={isSubmitting}
              className="h-9 w-32 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Auto</option>
              {ROVER_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate mock telemetry
          </Button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-status-good">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
