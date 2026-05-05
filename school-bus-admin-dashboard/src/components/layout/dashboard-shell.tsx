'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Bus,
  ClipboardCheck,
  Gauge,
  LogOut,
  Map,
  Network,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Users,
  UserRoundCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/session-context';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, tenantId, setTenantId, logout, orgApi } = useSession();
  const [tenantOptions, setTenantOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [isDayMode, setIsDayMode] = useState(false);

  const navItems = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { href: '/', label: 'Executive Overview', icon: Gauge },
        { href: '/organizations', label: 'Organizations', icon: Building2 },
      ];
    }
    return [
      { href: '/', label: 'Command Center', icon: Gauge },
      { href: '/live-map', label: 'Live Map', icon: Map },
      { href: '/students', label: 'Students', icon: Users },
      { href: '/drivers', label: 'Drivers', icon: UserRoundCog },
      { href: '/staff', label: 'Staff', icon: ShieldCheck },
      { href: '/buses', label: 'Fleet', icon: Bus },
      { href: '/attendance', label: 'Attendance', icon: ClipboardCheck },
      { href: '/routes', label: 'Routes', icon: Route },
    ];
  }, [user?.role]);

  const activeTenantName =
    tenantOptions.find((tenant) => tenant.id === tenantId)?.name ??
    (user?.tenantId ? 'School Tenant' : 'Global Console');

  useEffect(() => {
    document.documentElement.classList.toggle('day-mode', isDayMode);
  }, [isDayMode]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    orgApi
      .listSwitcherTenants()
      .then((res) => {
        const tenants = (res.data as Array<{ id: string; name: string }>) ?? [];
        setTenantOptions(tenants);
        if (!tenantId && tenants[0]?.id) {
          setTenantId(tenants[0].id);
        }
      })
      .catch(() => setTenantOptions([]));
  }, [orgApi, setTenantId, tenantId, user?.role]);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-zinc-950 text-zinc-100 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-zinc-800 bg-zinc-950 px-4 py-5">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            <Network size={22} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-[0.16em] text-white">KLB</div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Transport Ops</div>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-zinc-500">
            <span>Workspace</span>
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-300">Live</span>
          </div>
          <div className="truncate text-sm font-semibold text-zinc-100">{activeTenantName}</div>
          <div className="mt-1 truncate text-xs text-zinc-500">{user?.role?.replaceAll('_', ' ') ?? 'Admin'}</div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white',
                pathname === item.href &&
                  'border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-sm shadow-cyan-950/40',
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Activity size={16} className="text-emerald-300" />
            System Health
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ['API', 'On'],
              ['GPS', 'Live'],
              ['OTP', 'Dev'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-zinc-800 bg-black/20 px-2 py-2">
                <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</div>
                <div className="text-xs font-semibold text-emerald-300">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles size={14} />
                Advanced Admin Console
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-white">Transport Command Center</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden h-10 min-w-64 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-500 md:flex">
                <Search size={16} />
                Search students, buses, routes
              </div>
            {user?.role === 'SUPER_ADMIN' ? (
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-400"
              >
                <option value="">Select tenant</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button variant="ghost" onClick={() => setIsDayMode((value) => !value)} aria-label="Toggle theme">
              <SunMedium size={16} />
            </Button>
            <Button variant="secondary" onClick={logout}>
              <LogOut size={16} />
              Logout
            </Button>
            </div>
          </div>
        </header>
        <section className="min-h-[calc(100vh-89px)] bg-[linear-gradient(180deg,#09090b_0%,#111827_48%,#18181b_100%)] p-5 md:p-7">
          {children}
        </section>
      </main>
    </div>
  );
}
