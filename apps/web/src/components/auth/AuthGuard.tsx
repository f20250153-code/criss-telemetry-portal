"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@telemetry/shared";
import { useAuthStore } from "@/stores/authStore";
import { Activity } from "lucide-react";

/**
 * Gates a page behind authentication (and optionally a specific role).
 *
 * IMPORTANT: this is UX convenience, not a security boundary. Every
 * engineer-only action is re-checked by the backend's `requireRole`
 * middleware regardless of what this component does — see
 * apps/server/src/middleware/auth.ts.
 */
export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const router = useRouter();
  const { user, token, hasHydrated, checkSession } = useAuthStore();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (!hasHydrated || !token || hasCheckedSession.current) return;
    hasCheckedSession.current = true;
    void checkSession();
  }, [hasHydrated, token, checkSession]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, token, user, requiredRole, router]);

  const isAuthorized = Boolean(hasHydrated && token && user && (!requiredRole || user.role === requiredRole));

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Activity className="h-6 w-6 motion-safe:animate-pulse" />
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}
