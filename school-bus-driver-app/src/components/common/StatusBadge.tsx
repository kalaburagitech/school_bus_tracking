import { Text, View } from 'react-native';

export function StatusBadge({ status }: { status: 'IN' | 'OUT' }) {
  const color = status === 'IN' ? 'bg-brand-success' : 'bg-brand-danger';
  return (
    <View className={`rounded-full px-3 py-1 ${color}`}>
      <Text className="text-xs font-semibold text-white">{status}</Text>
    </View>
  );
}
