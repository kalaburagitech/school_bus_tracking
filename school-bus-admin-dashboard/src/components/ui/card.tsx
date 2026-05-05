import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-4 shadow-sm shadow-black/20',
        className,
      )}
      {...props}
    />
  );
}
