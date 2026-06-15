import axios from 'axios';

// Prefer env-configured API URL, fall back to local backend on port 5001
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_STORAGE_KEY = 'cloth_erp_auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 2;

const isRetryableError = (error) => {
  if (!error) return false;
  if (!error.response) return true;
  if (error.code === 'ECONNABORTED') return true;
  return RETRYABLE_STATUS.has(error.response.status);
};

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

// Response interceptor: retry transient failures; handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (config && isRetryableError(error)) {
      const method = (config.method || 'get').toUpperCase();
      const hasIdempotencyKey = Boolean(config.headers?.['Idempotency-Key']);
      const retryCount = config.__retryCount || 0;
      const canRetry = retryCount < MAX_RETRIES && (method === 'GET' || hasIdempotencyKey);

      if (canRetry) {
        config.__retryCount = retryCount + 1;
        await new Promise((resolve) => setTimeout(resolve, 400 * config.__retryCount));
        return api(config);
      }
    }

    if (error.response && error.response.status === 401) {
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
