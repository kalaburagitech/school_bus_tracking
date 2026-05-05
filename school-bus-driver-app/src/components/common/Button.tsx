import { Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
}) {
  const classes: Record<Variant, string> = {
    primary: 'bg-brand-primary',
    secondary: 'bg-brand-secondary',
    ghost: 'bg-slate-700/30',
  };
  return (
    <Pressable onPress={onPress} className={`rounded-2xl px-5 py-4 ${classes[variant]}`}>
      <Text className="text-center text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
