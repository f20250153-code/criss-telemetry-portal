"use client";

import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/dashboard/ConnectionBadge";
import { useAuthStore } from "@/stores/authStore";
import { useTelemetryStore } from "@/stores/telemetryStore";

export function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const connectionStatus = useTelemetryStore((s) => s.connectionStatus);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center gap-2">
        <Activity aria-hidden="true" className="h-5 w-5 text-primary" />
        <span className="font-medium">Rover Telemetry Portal</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <ConnectionBadge status={connectionStatus} />
        <span className="text-muted-foreground">
          {user?.name} ·{" "}
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold uppercase text-secondary-foreground">
            {user?.role}
          </span>
        </span>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </header>
  );
}
