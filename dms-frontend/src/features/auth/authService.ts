import { axiosClient } from '@/api/axiosClient';
import { AuthResponse, LoginRequest, RegisterRequest } from './types';

// Matches AuthController exactly: POST /api/auth/login, POST /api/auth/register.
// There is no logout endpoint (JWT is stateless) and no refresh endpoint.
export const authService = {
  login: (payload: LoginRequest) =>
    axiosClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterRequest) =>
    axiosClient.post<{ message: string }>('/auth/register', payload).then((r) => r.data),
};
