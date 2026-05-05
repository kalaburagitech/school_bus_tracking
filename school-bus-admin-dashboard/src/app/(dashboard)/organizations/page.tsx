'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Plus, Search, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSession } from '@/lib/session-context';

type Org = { id: string; name: string; slug: string; status: string };

export default function OrganizationsPage() {
  const { orgApi, user } = useSession();
  const [rows, setRows] = useState<Org[]>([]);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  const reload = () =>
    orgApi
      .listOrganizations({ search })
      .then((res) => {
        setRows(((res.data as { data: Org[] }).data ?? []) as Org[]);
        setLoadError('');
      })
      .catch((err) => setLoadError((err as Error).message));

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    void reload();
  }, [search, user?.role]);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <Card className="max-w-xl border-amber-400/20">
        <h2 className="text-xl font-semibold text-white">Super Admin access only</h2>
        <p className="mt-2 text-sm text-zinc-400">Organization management is restricted to platform admins.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Building2 size={16} />
            Platform tenant registry
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Organizations</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Create, search, and audit every school tenant connected to the transport command platform.
          </p>
        </div>
        <Link
          href="/organizations/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
        >
          <Plus size={16} />
          Create Organization
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Total tenants', rows.length.toString(), Building2, 'text-cyan-300'],
          ['Active workspaces', rows.filter((org) => org.status === 'ACTIVE').length.toString(), CheckCircle2, 'text-emerald-300'],
          ['Access model', 'Role guarded', ShieldCheck, 'text-amber-300'],
        ].map(([label, value, Icon, color]) => (
          <Card key={label as string}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{label as string}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value as string}</p>
              </div>
              <Icon className={color as string} size={24} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Search size={16} className="text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="h-10 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </div>
        {loadError ? (
          <div className="border-b border-amber-400/20 bg-amber-400/5 px-5 py-3 text-sm text-amber-200">
            Could not load organizations: {loadError}
          </div>
        ) : null}
        <div className="divide-y divide-zinc-800">
        {rows.map((org) => (
          <div key={org.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Link href={`/organizations/${org.id}`} className="text-base font-semibold text-white hover:text-cyan-200">
                {org.name}
              </Link>
              <p className="mt-1 text-sm text-zinc-500">{org.slug}</p>
            </div>
            <span className="w-fit rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300">
              {org.status}
            </span>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">No organizations match your search.</div>
        ) : null}
        </div>
      </Card>
      </div>
  );
}
