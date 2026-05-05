import { useMemo } from 'react';

type Location = { latitude: number; longitude: number };

export function useInterpolatedMarker(target: Location | null) {
  return useMemo(
    () =>
      target
        ? {
            latitude: target.latitude,
            longitude: target.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.05,
          }
        : {
            latitude: 15.1494,
            longitude: 76.9414,
            latitudeDelta: 0.08,
            longitudeDelta: 0.05,
          },
    [target],
  );
}
