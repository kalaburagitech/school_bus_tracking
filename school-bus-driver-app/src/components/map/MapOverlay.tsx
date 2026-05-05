import { Text, View } from 'react-native';

export function MapOverlay({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="absolute left-4 right-4 top-16 rounded-2xl border border-slate-700/60 bg-slate-950/80 p-4">
      <Text className="text-lg font-semibold text-white">{title}</Text>
      <Text className="mt-1 text-sm text-slate-300">{subtitle}</Text>
    </View>
  );
}
