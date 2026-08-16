import { cn } from "@/lib/utils";
import type { RoverState } from "@telemetry/shared";

const STATE_STYLES: Record<RoverState, string> = {
  IDLE: "bg-secondary text-secondary-foreground",
  DRIVING: "bg-status-good/15 text-status-good",
  CHARGING: "bg-status-warning/15 text-status-warning",
  FAULT: "bg-status-critical/15 text-status-critical",
  ESTOP: "bg-status-critical text-white",
};

export function RoverStateBadge({ state }: { state: RoverState }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide",
        STATE_STYLES[state],
      )}
    >
      {state}
    </span>
  );
}
