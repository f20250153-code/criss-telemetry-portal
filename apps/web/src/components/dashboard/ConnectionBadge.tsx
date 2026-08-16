import { Radio, RadioTower, WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/stores/telemetryStore";

const CONFIG: Record<ConnectionStatus, { label: string; icon: typeof Radio; className: string }> = {
  connecting: { label: "Connecting…", icon: Radio, className: "text-status-warning" },
  connected: { label: "Live", icon: RadioTower, className: "text-status-good" },
  disconnected: { label: "Disconnected", icon: WifiOff, className: "text-muted-foreground" },
  error: { label: "Connection error", icon: AlertTriangle, className: "text-status-critical" },
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", className)}>
      <Icon className={cn("h-3.5 w-3.5", status === "connected" && "motion-safe:animate-pulse")} />
      <span>{label}</span>
    </div>
  );
}
