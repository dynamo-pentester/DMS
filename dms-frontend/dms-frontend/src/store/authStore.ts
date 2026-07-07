import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, CurrentUser } from "@/types/auth";
import type { Role } from "@/types/common";

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  setSession: (auth: AuthResponse) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setSession: (auth) =>
        set({
          token: auth.token,
          user: {
            fullName: auth.fullName,
            email: auth.email,
            roles: auth.roles,
            expiresAt: auth.expiresAt,
          },
          isAuthenticated: true,
        }),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      hasRole: (...roles) => {
        const user = get().user;
        if (!user) return false;
        return roles.some((r) => user.roles.includes(r));
      },

      isTokenExpired: () => {
        const user = get().user;
        if (!user) return true;
        return new Date(user.expiresAt).getTime() <= Date.now();
      },
    }),
    {
      name: "dms-auth", // localStorage key
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
