'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session-context';

export default function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const { orgApi, user } = useSession();
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    void orgApi
      .getOrganizationDetails(params.id)
      .then((res) => setDetails(res.data as Record<string, unknown>));
  }, [orgApi, params.id, user?.role]);

  if (user?.role !== 'SUPER_ADMIN') return <p>Super Admin access only.</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Organization Details</h2>
      <pre className="overflow-auto rounded border border-slate-800 bg-slate-900 p-3 text-xs">
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}
