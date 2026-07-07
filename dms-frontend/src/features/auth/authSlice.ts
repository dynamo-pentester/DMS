import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from './authService';
import { AuthUser, LoginRequest } from './types';
import { apiErrorMessage } from '@/utils/errorUtils';

const STORAGE_KEY = 'dms.auth';

interface StoredAuth {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

function loadFromStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredAuth = JSON.parse(raw);
    // Drop anything past the JWT's own expiry so a stale token never gets
    // attached by the axios interceptor.
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const persisted = loadFromStorage();

const initialState: AuthState = {
  token: persisted?.token ?? null,
  expiresAt: persisted?.expiresAt ?? null,
  user: persisted?.user ?? null,
  status: 'idle',
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      return await authService.login(payload);
    } catch (err) {
      return rejectWithValue(apiErrorMessage(err, 'Invalid email or password.'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.expiresAt = null;
      state.user = null;
      localStorage.removeItem(STORAGE_KEY);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.expiresAt = action.payload.expiresAt;
        state.user = {
          fullName: action.payload.fullName,
          email: action.payload.email,
          roles: action.payload.roles,
        };
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            token: state.token,
            expiresAt: state.expiresAt,
            user: state.user,
          })
        );
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Login failed.';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// ---- Selectors ----
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.token;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthRoles = (state: { auth: AuthState }) => state.auth.user?.roles ?? [];
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export function hasRole(roles: string[], allowed: string[]): boolean {
  return roles.some((r) => allowed.includes(r));
}
