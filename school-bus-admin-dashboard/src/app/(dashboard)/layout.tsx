'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useSession } from '@/lib/session-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, isHydrated } = useSession();

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) router.replace('/login');
  }, [accessToken, isHydrated, router]);

  if (!isHydrated || !accessToken) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
