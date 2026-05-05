'use client';

import { useMemo, useState } from 'react';
import { BusFront, MapPinned, Radio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLiveBuses } from '@/hooks/useLiveBuses';
import { useSession } from '@/lib/session-context';

export default function LiveMapPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const { accessToken, tenantId } = useSession();
  const { busPoints, busMeta, lastEventAt, mode } = useLiveBuses(
    baseUrl,
    accessToken,
    tenantId || undefined,
  );
  const points = Object.values(busPoints);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const selectedMeta = selectedBusId ? busMeta[selectedBusId] : null;

  const mapUrl = useMemo(() => {
    if (!googleKey) return '';
    const center = points[0] ?? { latitude: 17.3297, longitude: 76.8343 };
    const markers = points
      .slice(0, 20)
      .map((point) => `markers=color:blue%7Clabel:B%7C${point.latitude},${point.longitude}`)
      .join('&');
    const markerPart = markers ? `&${markers}` : '';
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=13&size=1200x620&scale=2&maptype=roadmap${markerPart}&key=${googleKey}`;
  }, [googleKey, points]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
          <Radio size={16} />
          {mode} {lastEventAt ? `| ${new Date(lastEventAt).toLocaleTimeString()}` : ''}
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-white">Live Fleet Map</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Tracks live bus positions from WebSocket with polling fallback. Add Google key for rendered map tiles.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="overflow-hidden p-0">
          {mapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapUrl} alt="Live bus map" className="h-[560px] w-full object-cover" />
          ) : (
            <div className="flex h-[560px] flex-col items-center justify-center border border-dashed border-zinc-800 bg-zinc-950 text-center">
              <MapPinned size={42} className="text-zinc-600" />
              <p className="mt-4 font-semibold text-zinc-200">Google Maps key not configured</p>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                Put your key in `school-bus-admin-dashboard/.env.local` as
                `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key` and restart Next.js.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-0">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h3 className="text-lg font-semibold text-white">Fleet Signals</h3>
            <p className="mt-1 text-sm text-zinc-500">{points.length} buses reporting GPS</p>
          </div>
          <div className="max-h-[560px] divide-y divide-zinc-800 overflow-y-auto">
            {points.map((point) => {
              const meta = busMeta[point.busId];
              return (
                <button
                  type="button"
                  key={point.busId}
                  onClick={() => setSelectedBusId(point.busId)}
                  className="w-full px-5 py-4 text-left transition hover:bg-cyan-400/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                      <BusFront size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{meta?.registrationNumber ?? point.busId}</div>
                      <div className="text-xs text-zinc-500">
                        {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {points.length === 0 ? <div className="px-5 py-12 text-center text-sm text-zinc-500">No live points yet.</div> : null}
          </div>
        </Card>
      </div>

      {selectedMeta ? (
        <Card className="border-cyan-400/20 bg-cyan-400/5">
          <p className="font-semibold text-white">Selected Bus: {selectedMeta.registrationNumber}</p>
          <p className="mt-2 text-sm text-zinc-400">Driver: {selectedMeta.driverPhone ?? 'Unassigned'}</p>
          <p className="text-sm text-zinc-400">Students onboard: {selectedMeta.studentsOnboard}</p>
          <p className="text-sm text-zinc-400">Status: {selectedMeta.activeTripId ? 'On Trip' : 'Idle'}</p>
        </Card>
      ) : null}
    </div>
  );
}
