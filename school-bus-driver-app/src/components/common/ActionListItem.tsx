import { Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

export function ActionListItem({ name, status }: { name: string; status: 'IN' | 'OUT' }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/70 p-3">
      <View className="flex-row items-center gap-3">
        <Avatar initials={name.slice(0, 2).toUpperCase()} />
        <Text className="text-base font-medium text-white">{name}</Text>
      </View>
      <StatusBadge status={status} />
    </View>
  );
}
