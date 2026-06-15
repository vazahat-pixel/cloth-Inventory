import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` — useful for search filters and API params
 * while keeping the input responsive.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
