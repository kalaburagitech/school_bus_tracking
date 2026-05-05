'use client';

import { useState } from 'react';

export function SearchFilters() {
  const [query, setQuery] = useState('');
  return (
    <div className="mb-4 flex items-center gap-3">
      <input
        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm">
        <option>All</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </div>
  );
}
