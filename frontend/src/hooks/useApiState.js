import { useState, useCallback } from 'react';

/**
 * Hook to manage loading and error state for async/network operations.
 * Use with API calls, form submissions, etc.
 *
 * @returns {{ loading: boolean, error: string | null, setLoading: Function, setError: Function, clearError: Function, runAsync: Function }}
 */
export function useApiState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Wraps an async function and manages loading/error state.
   * @param {Function} asyncFn - Function that returns a promise
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const runAsync = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      await asyncFn();
      setLoading(false);
      return { success: true };
    } catch (err) {
      const message = err?.message ?? 'Something went wrong. Please try again.';
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, []);

  return { loading, error, setLoading, setError, clearError, runAsync };
}

export default useApiState;
