import { memo } from 'react';
import { Card } from '@/components/ui/card';

const TableRow = memo(function TableRow({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <tr className="border-t border-slate-800">
      <td className="py-3 text-slate-100">{name}</td>
      <td className="py-3 text-slate-300">{status}</td>
    </tr>
  );
});

export function DataTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; name: string; status: string }>;
}) {
  return (
    <Card className="overflow-x-auto">
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="pb-3">Name</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow key={row.id} name={row.name} status={row.status} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
