import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoverStateBadge } from "@/components/dashboard/RoverStateBadge";
import type { TelemetryPayload } from "@telemetry/shared";

export function RecentReadings({ history }: { history: TelemetryPayload[] }) {
  const recent = [...history].reverse().slice(0, 8);

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-medium">Recent readings</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No readings yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recent.map((reading, i) => (
              <li key={`${reading.id}-${i}`} className="flex items-center justify-between gap-4 py-2">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {new Date(reading.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="font-mono tabular-nums">{reading.batteryVoltage.toFixed(2)} V</span>
                <span className="font-mono tabular-nums">{reading.temperature.toFixed(1)} °C</span>
                <RoverStateBadge state={reading.state} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
