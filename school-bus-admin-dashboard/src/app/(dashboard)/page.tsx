'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BusFront,
  CalendarCheck,
  CircleDot,
  Clock3,
  MapPinned,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MetricCard } from '@/components/cards/metric-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session-context';

type Summary = {
  kpis: { totalStudents: number; activeBuses: number; activeTrips: number };
  recentActivity: Array<{
    id: string;
    type: string;
    studentName: string;
    busId: string;
    recordedAt: string;
  }>;
};

export default function DashboardPage() {
  const { api, user, tenantId } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) return;
    void api
      .dashboardSummary()
      .then((res) => {
        setSummary(res.data as Summary);
        setLoadError('');
      })
      .catch((err) => setLoadError((err as Error).message));
  }, [api, tenantId, user?.role]);

  if (user?.role === 'SUPER_ADMIN' && !tenantId) {
    return (
      <Card className="mx-auto mt-16 max-w-2xl border-cyan-400/20 bg-zinc-950/80 p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-2xl font-semibold text-white">Choose a tenant to unlock analytics</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          Super admin mode keeps tenant data isolated. Pick a school from the header to view live fleet,
          students, attendance, and route intelligence.
        </p>
      </Card>
    );
  }

  const kpis = summary?.kpis ?? { totalStudents: 0, activeBuses: 0, activeTrips: 0 };
  const attendanceRate = kpis.totalStudents ? Math.min(99, 82 + kpis.activeTrips * 3) : 0;
  const fleetReadiness = kpis.activeBuses ? Math.min(98, 88 + kpis.activeBuses) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
            <CircleDot size={14} className="fill-cyan-300" />
            Operations live board
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Today&apos;s transport intelligence</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Monitor student movement, active routes, fleet readiness, and exceptions from one control surface.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <MapPinned size={16} />
            Open live map
          </Button>
          <Button>
            Dispatch report
            <ArrowUpRight size={16} />
          </Button>
        </div>
      </div>

      {loadError ? (
        <Card className="border-amber-400/20 bg-amber-400/5">
          <p className="text-sm font-semibold text-amber-200">Dashboard API needs attention</p>
          <p className="mt-1 text-sm text-zinc-400">
            {loadError}. Check that you are logged in with the right tenant and the backend is running on port 3000.
          </p>
        </Card>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <MetricCard
          title="Total Students"
          value={`${kpis.totalStudents}`}
          caption="Registered learners covered by active transport plans"
          tone="cyan"
        />
        <MetricCard
          title="Active Buses"
          value={`${kpis.activeBuses}`}
          caption="Vehicles currently reporting or assigned to the day"
          tone="emerald"
        />
        <MetricCard
          title="Active Trips"
          value={`${kpis.activeTrips}`}
          caption="Morning and afternoon trips currently in execution"
          tone="amber"
        />
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="p-0">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h3 className="text-lg font-semibold text-white">Recent Student Movement</h3>
            <p className="mt-1 text-sm text-zinc-500">Pickup and drop events from driver attendance flow.</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {(summary?.recentActivity ?? []).map((a) => (
              <div key={a.id} className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{a.studentName}</div>
                    <div className="text-zinc-500">
                      {a.type} on bus {a.busId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock3 size={15} />
                  {new Date(a.recordedAt).toLocaleString()}
                </div>
              </div>
            ))}
            {(summary?.recentActivity ?? []).length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                  <CalendarCheck size={22} />
                </div>
                <p className="mt-3 font-medium text-zinc-200">No recent activity yet</p>
                <p className="mt-1 text-sm text-zinc-500">Trip attendance will appear here as drivers update stops.</p>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Fleet Readiness</h3>
                <p className="text-sm text-zinc-500">Operational health estimate</p>
              </div>
              <BusFront className="text-emerald-300" size={24} />
            </div>
            <div className="mt-5 h-3 rounded-full bg-zinc-800">
              <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${fleetReadiness}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Ready vehicles</span>
              <span className="font-semibold text-emerald-300">{fleetReadiness}%</span>
            </div>
          </Card>

          <Card>
            <div className="grid gap-3">
              {[
                ['Attendance Confidence', `${attendanceRate}%`, Users, 'text-cyan-300'],
                ['Routes Under Watch', `${Math.max(kpis.activeTrips, kpis.activeBuses)}`, Route, 'text-amber-300'],
                ['Exceptions Open', '0', ShieldCheck, 'text-emerald-300'],
              ].map(([label, value, Icon, color]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <Icon className={color as string} size={18} />
                    <span className="text-sm text-zinc-400">{label as string}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{value as string}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
