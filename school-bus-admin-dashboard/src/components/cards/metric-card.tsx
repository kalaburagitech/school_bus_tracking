import { Card } from '@/components/ui/card';

export function MetricCard({
  title,
  value,
  caption,
  tone = 'cyan',
}: {
  title: string;
  value: string;
  caption?: string;
  tone?: 'cyan' | 'emerald' | 'amber';
}) {
  const tones = {
    cyan: 'text-cyan-200 bg-cyan-400/10 border-cyan-400/20',
    emerald: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/20',
    amber: 'text-amber-200 bg-amber-400/10 border-amber-400/20',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
          Live
        </span>
      </div>
      {caption ? <p className="mt-3 text-xs text-zinc-500">{caption}</p> : null}
    </Card>
  );
}
