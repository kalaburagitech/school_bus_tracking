import { Text, View } from 'react-native';

export function Avatar({ initials }: { initials: string }) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-secondary">
      <Text className="font-semibold text-white">{initials}</Text>
    </View>
  );
}
