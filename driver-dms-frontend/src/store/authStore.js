import { create } from "zustand";
import { loginUser } from "../services/authService";

function loadStoredUser() {
  const raw = localStorage.getItem("dms_user");
  return raw ? JSON.parse(raw) : null;
}

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem("dms_token") || null,
  user: loadStoredUser(),
  isAuthenticated: !!localStorage.getItem("dms_token"),

  login: async (email, password) => {
    const { data } = await loginUser({ email, password });
    // data: AuthResponse { token, expiresAt, fullName, email, roles }
    const user = {
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
      expiresAt: data.expiresAt,
    };
    localStorage.setItem("dms_token", data.token);
    localStorage.setItem("dms_user", JSON.stringify(user));
    set({ token: data.token, user, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    set({ token: null, user: null, isAuthenticated: false });
  },

  hasRole: (...roles) => {
    const user = get().user;
    return !!user && roles.some((r) => user.roles?.includes(r));
  },
}));
