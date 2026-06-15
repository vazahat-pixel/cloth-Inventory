/**
 * Normalize API / Redux thunk errors into user-facing messages.
 */
export function extractApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return err[0] || fallback;

  const data = err.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (Array.isArray(data?.errors) && data.errors[0]) return String(data.errors[0]);

  if (typeof err.message === 'string' && err.message.trim()) {
    if (err.message === 'Network Error') {
      return 'Network connection failed. Check your connection and try again.';
    }
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    return err.message;
  }

  return fallback;
}
