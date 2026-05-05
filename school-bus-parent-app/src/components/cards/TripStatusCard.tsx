import { Text, View } from 'react-native';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

export function TripStatusCard({
  eta,
  driverLabel,
  status,
  mode,
}: {
  eta: string;
  driverLabel: string;
  status: 'IN' | 'OUT';
  mode: string;
}) {
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold text-white">ETA {eta}</Text>
          <Text className="mt-1 text-sm text-slate-300">{driverLabel}</Text>
          <Text className="mt-1 text-xs text-slate-400">mode: {mode}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
    </Card>
  );
}
