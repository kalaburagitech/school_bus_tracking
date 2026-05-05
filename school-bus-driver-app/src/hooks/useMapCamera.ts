import { useMemo } from 'react';

export function useMapCamera() {
  return useMemo(
    () => ({ latitude: 15.1394, longitude: 76.9214, latitudeDelta: 0.09, longitudeDelta: 0.05 }),
    [],
  );
}
