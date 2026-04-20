import axios from 'axios';

// Prefer env-configured API URL, fall back to local backend on port 5001
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_STORAGE_KEY = 'cloth_erp_auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the bearer token (read directly from localStorage to avoid circular deps)
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear persisted auth to force re-login; avoid importing store/authSlice to prevent circular deps
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return Promise.reject(error);
  },
);

export default api;
