import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Session expired');
  }
});

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

const mapRole = (backendRole) => {
  if (backendRole === 'admin') return 'Admin';
  if (backendRole === 'store_staff') return 'Staff';
  return backendRole; // fallback
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

      const mappedRole = mapRole(user?.role);
      const mappedUser = { ...user, role: mappedRole };

      state.user = mappedUser;
      state.token = token;
      state.role = mappedRole;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      saveStoredAuth(token, mappedUser);
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
  extraReducers: (builder) => {
    builder
      .addCase(getMe.fulfilled, (state, action) => {
        const user = action.payload;
        const mappedRole = mapRole(user?.role);
        const mappedUser = { ...user, role: mappedRole };
        state.user = mappedUser;
        state.role = mappedRole;
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.role = '';
        state.isAuthenticated = false;
        clearStoredAuth();
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
