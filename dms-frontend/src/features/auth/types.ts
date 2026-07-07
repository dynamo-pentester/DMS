// Mirrors DriverDms.Application.DTOs.AuthDtos.cs exactly.
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string; // must be one of RoleSeeder.DefaultRoles - see constants/roles.ts
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface AuthUser {
  fullName: string;
  email: string;
  roles: string[];
}
