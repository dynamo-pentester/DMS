import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

// RegisterRequest: { fullName, email, password, role }
export const registerUser = (payload) =>
  api.post(API_ENDPOINTS.AUTH.REGISTER, payload);

// LoginRequest: { email, password } -> AuthResponse: { token, expiresAt, fullName, email, roles }
export const loginUser = (payload) =>
  api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
