export function PaginationBar() {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-300">
      <button className="rounded-lg border border-slate-700 px-3 py-1">Prev</button>
      <span>Page 1 of 10</span>
      <button className="rounded-lg border border-slate-700 px-3 py-1">Next</button>
    </div>
  );
}
