"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelemetryPayload } from "@telemetry/shared";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function TelemetryChart({ history }: { history: TelemetryPayload[] }) {
  const data = history.map((reading) => ({
    time: formatTime(reading.timestamp),
    battery: reading.batteryVoltage,
    temperature: reading.temperature,
  }));

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-medium">Battery &amp; temperature history</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No telemetry yet — trigger a reading to see live data.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="battery"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={36}
                />
                <YAxis
                  yAxisId="temperature"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  yAxisId="battery"
                  type="monotone"
                  dataKey="battery"
                  name="Battery (V)"
                  stroke="var(--color-status-good)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="temperature"
                  type="monotone"
                  dataKey="temperature"
                  name="Temp (°C)"
                  stroke="var(--color-status-warning)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
