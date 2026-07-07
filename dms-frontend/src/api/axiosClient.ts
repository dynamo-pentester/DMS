import axios from 'axios';
import { store } from '@/store/store';
import { logout } from '@/features/auth/authSlice';

// Falls back to the Vite dev proxy (see vite.config.ts) when no env var is set,
// so `npm run dev` works against a local Driver.API with zero config.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach JWT ----
// Driver.API's AuthController issues a single JWT with an 8-hour expiry and has
// no refresh-token endpoint, so there is nothing to refresh here - once the
// token expires the 401 interceptor below simply logs the user out.
axiosClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: handle expired/invalid session ----
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      store.dispatch(logout());
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
