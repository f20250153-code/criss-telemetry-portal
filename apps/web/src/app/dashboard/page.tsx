"use client";

import { Battery, Thermometer, Clock, Cpu } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RoverStateBadge } from "@/components/dashboard/RoverStateBadge";
import { TelemetryChart } from "@/components/dashboard/TelemetryChart";
import { RecentReadings } from "@/components/dashboard/RecentReadings";
import { useTelemetrySocket } from "@/hooks/useTelemetrySocket";
import { useTelemetryStore } from "@/stores/telemetryStore";

function batteryTone(voltage: number): "good" | "warning" | "critical" {
  if (voltage < 18) return "critical";
  if (voltage < 22) return "warning";
  return "good";
}

function temperatureTone(celsius: number): "good" | "warning" | "critical" {
  if (celsius >= 60) return "critical";
  if (celsius >= 45) return "warning";
  return "good";
}

function DashboardContent() {
  useTelemetrySocket();
  const { current, history, lastUpdatedAt, error } = useTelemetryStore();

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="mx-auto max-w-6xl space-y-4 p-6">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-status-critical/30 bg-status-critical/10 px-4 py-2 text-sm text-status-critical"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Battery"
            value={current ? current.batteryVoltage.toFixed(2) : "—"}
            unit="V"
            icon={Battery}
            tone={current ? batteryTone(current.batteryVoltage) : "default"}
          />
          <StatCard
            label="Temperature"
            value={current ? current.temperature.toFixed(1) : "—"}
            unit="°C"
            icon={Thermometer}
            tone={current ? temperatureTone(current.temperature) : "default"}
          />
          <div className="flex flex-col justify-center gap-1.5 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rover state
              </span>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            {current ? <RoverStateBadge state={current.state} /> : <span className="text-2xl">—</span>}
          </div>
          <div className="flex flex-col justify-center gap-1.5 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last update
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-mono text-sm tabular-nums">
              {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "Waiting for data…"}
            </span>
          </div>
        </div>

        <TelemetryChart history={history} />
        <RecentReadings history={history} />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
