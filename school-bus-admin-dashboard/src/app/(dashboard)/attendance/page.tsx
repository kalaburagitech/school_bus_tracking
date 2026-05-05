'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session-context';

export default function AttendancePage() {
  const { api } = useSession();
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void api
      .listAttendanceLogs()
      .then((res) => setLogs(((res.data as { data: Array<Record<string, unknown>> }).data ?? []) as Array<Record<string, unknown>>));
  }, [api]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Attendance Logs</h2>
      <pre className="overflow-auto rounded border border-slate-800 bg-slate-900 p-3 text-xs">
        {JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  );
}
