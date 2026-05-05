/**
 * Smooth GPS interpolation hook.
 * When a new GPS coordinate arrives, this hook animates the marker from the
 * previous position to the new one over INTERPOLATION_MS milliseconds,
 * yielding React Animated values for latitude and longitude.
 * This creates the Swiggy/Zomato style smooth marker animation.
 */
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const INTERPOLATION_MS = 2000;

export type LatLng = { latitude: number; longitude: number };

export function useSmoothedBusLocation(target: LatLng | null) {
  const latAnim = useRef(new Animated.Value(target?.latitude ?? 0)).current;
  const lngAnim = useRef(new Animated.Value(target?.longitude ?? 0)).current;

  // Track the current animated value as a plain number so we can read it synchronously
  const latRef = useRef(target?.latitude ?? 0);
  const lngRef = useRef(target?.longitude ?? 0);

  useEffect(() => {
    // Listen to animated values to keep refs in sync
    const latId = latAnim.addListener(({ value }) => { latRef.current = value; });
    const lngId = lngAnim.addListener(({ value }) => { lngRef.current = value; });
    return () => {
      latAnim.removeListener(latId);
      lngAnim.removeListener(lngId);
    };
  }, [latAnim, lngAnim]);

  useEffect(() => {
    if (!target) return;

    Animated.parallel([
      Animated.timing(latAnim, {
        toValue: target.latitude,
        duration: INTERPOLATION_MS,
        useNativeDriver: false, // animated map coordinates cannot use native driver
      }),
      Animated.timing(lngAnim, {
        toValue: target.longitude,
        duration: INTERPOLATION_MS,
        useNativeDriver: false,
      }),
    ]).start();
  }, [target?.latitude, target?.longitude]);

  return { latAnim, lngAnim };
}
