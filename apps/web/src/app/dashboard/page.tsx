"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";

function DashboardContent() {
  const { user, logout } = useAuthStore();

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-medium">Rover Telemetry Portal</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {user?.name} · <span className="uppercase">{user?.role}</span>
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <div className="p-6 text-sm text-muted-foreground">
        Signed in as <strong className="text-foreground">{user?.email}</strong>. The live
        telemetry dashboard is built out in the next phase.
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
