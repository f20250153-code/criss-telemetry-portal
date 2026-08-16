import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  tone?: "default" | "good" | "warning" | "critical";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-status-good",
    warning: "text-status-warning",
    critical: "text-status-critical",
  }[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className={cn("font-mono text-2xl font-semibold tabular-nums", toneClass)}>
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
