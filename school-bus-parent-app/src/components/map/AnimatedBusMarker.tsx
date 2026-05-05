import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { View } from 'react-native';

export function AnimatedBusMarker({ x = 0, y = 0 }: { x?: number; y?: number }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(x, { duration: 500 }) },
      { translateY: withTiming(y, { duration: 500 }) },
    ],
  }));

  return (
    <Animated.View style={style} className="h-4 w-4 rounded-full bg-brand-primary" />
  );
}
