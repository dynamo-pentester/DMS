import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

// A single Axios instance for the whole app, per the brief's "one Axios instance" requirement.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request interceptor: attach the JWT ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: normalize errors, handle 401 ----
//
// IMPORTANT: Driver.API does not currently expose a refresh-token endpoint - Login
// issues a single JWT valid for 8 hours (see AuthController.BuildToken). There is
// nothing to "silently refresh" against, so on a 401 we log the user out and send
// them back to /login rather than attempting a token refresh. If a refresh endpoint
// is added to the backend later, this is the place to wire it in.
let isLoggingOut = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.endsWith("/auth/login");
    if (error.response?.status === 401 && !isLoggingOut && !isLoginRequest) {
      isLoggingOut = true;
      useAuthStore.getState().logout();
      window.location.href = "/login?sessionExpired=1";
    }
    return Promise.reject(normalizeError(error));
  }
);

export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Normalizes the various error shapes the backend can return:
 * - { error: string }                          (controllers catching InvalidOperationException)
 * - { errors: string[] }                       (Identity errors on register)
 * - { errors: Record<string, string[]> }       (FluentValidation / ModelState)
 * - plain network / timeout errors
 */
function normalizeError(error: AxiosError): ApiError {
  if (!error.response) {
    return {
      status: null,
      message:
        error.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : "Could not reach the server. Check your connection and try again.",
    };
  }

  const status = error.response.status;
  const data = error.response.data as Record<string, unknown> | undefined;

  if (data && typeof data === "object") {
    if (typeof data.error === "string") {
      return { status, message: data.error };
    }
    if (Array.isArray(data.errors)) {
      return { status, message: (data.errors as string[]).join(" ") };
    }
    if (data.errors && typeof data.errors === "object") {
      const fieldErrors = data.errors as Record<string, string[]>;
      const firstMessage = Object.values(fieldErrors)[0]?.[0];
      return {
        status,
        message: firstMessage || "Please check the highlighted fields.",
        fieldErrors,
      };
    }
    if (typeof data.title === "string") {
      return { status, message: data.title };
    }
  }

  if (status === 404) return { status, message: "The requested item could not be found." };
  if (status === 403) return { status, message: "You don't have permission to do that." };
  if (status >= 500) return { status, message: "Something went wrong on our end. Please try again." };

  return { status, message: "Something went wrong. Please try again." };
}
