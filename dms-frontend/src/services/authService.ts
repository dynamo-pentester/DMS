import { api } from "@/api/axiosInstance";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  // Exposed for admin-only "create user" flows. There's no self-serve signup - the
  // backend register endpoint requires a role, so this isn't wired into the public
  // login screen. See features/users if a user-management page is added later.
  register: async (payload: RegisterRequest): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/auth/register", payload);
    return data;
  },
};
