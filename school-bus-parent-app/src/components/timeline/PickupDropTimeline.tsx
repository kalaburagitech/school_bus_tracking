import { Text, View } from 'react-native';

export function PickupDropTimeline({
  pickup,
  drop,
}: {
  pickup: string;
  drop: string;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4">
      <Text className="text-base font-semibold text-white">Today Timeline</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-slate-300">Pickup</Text>
        <Text className="font-medium text-white">{pickup}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-slate-300">Drop</Text>
        <Text className="font-medium text-white">{drop}</Text>
      </View>
    </View>
  );
}
