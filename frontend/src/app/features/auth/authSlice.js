import { createSlice } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'cloth_erp_auth';

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
};

const saveStoredAuth = (token, user) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const persistedAuth = loadStoredAuth();

const initialState = {
  user: persistedAuth?.user ?? null,
  token: persistedAuth?.token ?? null,
  role: persistedAuth?.user?.role ?? '',
  isAuthenticated: Boolean(persistedAuth?.token),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;

      state.user = user;
      state.token = token;
      state.role = user?.role ?? '';
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      saveStoredAuth(token, user);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload ?? 'Unable to log in. Please try again.';
      state.user = null;
      state.token = null;
      state.role = '';
      state.isAuthenticated = false;

      clearStoredAuth();
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = '';
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      clearStoredAuth();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
