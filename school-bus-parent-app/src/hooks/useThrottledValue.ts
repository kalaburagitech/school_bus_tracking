import { useEffect, useState } from 'react';

export function useThrottledValue<T>(value: T, delay = 250): T {
  const [throttled, setThrottled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setThrottled(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return throttled;
}
