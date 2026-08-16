"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function Home() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(user && token ? "/dashboard" : "/login");
  }, [hasHydrated, user, token, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Activity className="h-6 w-6 motion-safe:animate-pulse" />
      <p className="text-sm">Loading…</p>
    </main>
  );
}
