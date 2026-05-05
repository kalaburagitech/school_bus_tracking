import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children }: { children: ReactNode }) {
  return <View className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4">{children}</View>;
}
