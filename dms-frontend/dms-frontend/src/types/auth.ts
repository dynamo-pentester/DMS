import type { Role } from "./common";

// Mirrors DriverDms.Application.DTOs.LoginRequest
export interface LoginRequest {
  email: string;
  password: string;
}

// Mirrors DriverDms.Application.DTOs.RegisterRequest
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

// Mirrors DriverDms.Application.DTOs.AuthResponse
// NOTE: the backend does not issue a refresh token - the JWT is valid for 8 hours
// (see AuthController.BuildToken). There is no /api/auth/refresh endpoint today.
// The client tracks expiresAt and redirects to /login when the token expires.
export interface AuthResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  email: string;
  roles: Role[];
}

export interface CurrentUser {
  fullName: string;
  email: string;
  roles: Role[];
  expiresAt: string;
}
