import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@telemetry/shared";
import { apiFetch, ApiError } from "@/lib/apiClient";

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-validates a persisted token against the backend on app load. */
  checkSession: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      status: "idle",
      error: null,
      hasHydrated: false,

      login: async (email, password) => {
        set({ status: "loading", error: null });
        try {
          const data = await apiFetch<{ user: PublicUser; token: string }>("/auth/login", {
            method: "POST",
            body: { email, password },
          });
          set({ user: data.user, token: data.token, status: "authenticated", error: null });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Login failed. Please try again.";
          set({ status: "error", error: message, user: null, token: null });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, status: "idle", error: null });
      },

      checkSession: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const user = await apiFetch<PublicUser>("/auth/me", { token });
          set({ user, status: "authenticated", error: null });
        } catch {
          // Expired/invalid token — drop the stale session so the
          // guard redirects to /login instead of showing broken state.
          set({ user: null, token: null, status: "idle", error: null });
        }
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "telemetry-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
