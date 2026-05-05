export function StatusBadge({ status }: { status: 'IN' | 'OUT' }) {
  const classes = status === 'IN' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300';
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}
