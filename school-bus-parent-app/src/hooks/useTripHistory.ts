import { useMemo } from 'react';

export function useTripHistory() {
  return useMemo(() => [{ label: 'Pickup', time: '07:42 AM' }, { label: 'Drop', time: '03:55 PM' }], []);
}
