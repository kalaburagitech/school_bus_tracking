'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MapPinned, Plus, RouteIcon, Trash2, UserRoundPen } from 'lucide-react';
import {
  AdminInput,
  EmptyState,
  FormModal,
  SearchBar,
  shortId,
} from '@/components/admin/admin-controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/lib/session-context';

type RouteStop = {
  label: string;
  lat?: string;
  lng?: string;
};

type RouteRow = {
  id: string;
  name: string;
  waypoints?: RouteStop[] | null;
};

type RouteForm = {
  name: string;
  stops: RouteStop[];
};

const emptyRoute: RouteForm = {
  name: '',
  stops: [{ label: '', lat: '', lng: '' }],
};

function normalizeStops(stops: RouteStop[]) {
  return stops
    .map((stop) => ({
      label: stop.label.trim(),
      lat: stop.lat?.trim() || undefined,
      lng: stop.lng?.trim() || undefined,
    }))
    .filter((stop) => stop.label);
}

export default function RoutesPage() {
  const { api, tenantId, user } = useSession();
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyRoute);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async (query = search) => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before managing routes.');
      return;
    }
    try {
      const res = await api.listRoutes();
      const data = ((res.data as RouteRow[]) ?? []) as RouteRow[];
      const normalizedQuery = query.trim().toLowerCase();
      setRows(
        normalizedQuery
          ? data.filter((route) => route.name.toLowerCase().includes(normalizedQuery))
          : data,
      );
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void reload(''));
    // Load on entry/tenant switch. Search is explicit so typing in forms never triggers reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyRoute);
    setModalOpen(true);
  };

  const openEdit = (route: RouteRow) => {
    setEditing(route);
    setForm({
      name: route.name,
      stops: route.waypoints?.length ? route.waypoints : [{ label: '', lat: '', lng: '' }],
    });
    setModalOpen(true);
  };

  const saveRoute = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), stops: normalizeStops(form.stops) };
      if (editing) {
        await api.updateRoute(editing.id, payload);
      } else {
        await api.createRoute(payload);
      }
      setModalOpen(false);
      await reload(search);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateStop = (index: number, next: Partial<RouteStop>) => {
    setForm((current) => ({
      ...current,
      stops: current.stops.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, ...next } : stop,
      ),
    }));
  };

  const removeStop = (index: number) => {
    setForm((current) => ({
      ...current,
      stops: current.stops.filter((_, stopIndex) => stopIndex !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-white">Routes</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Build pickup/drop routes with ordered stops and optional GPS coordinates for map-ready planning.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Route
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} onSearch={() => void reload(search)} placeholder="Search route name" />
      {error ? <Card className="border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">{error}</Card> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Stops</th>
                <th className="px-5 py-3">Map readiness</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((route) => {
                const stops = route.waypoints ?? [];
                const geoStops = stops.filter((stop) => stop.lat && stop.lng).length;
                return (
                  <tr key={route.id} className="text-zinc-300">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                          <RouteIcon size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{route.name}</div>
                          <div className="text-xs text-zinc-500">RTE-{shortId(route.id)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{stops.length}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                        {geoStops}/{stops.length} geo stops
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(route)}>
                          <UserRoundPen size={16} />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <EmptyState title="No routes found" description="Add routes with pickup stops for planning and assignments." /> : null}
      </Card>

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Route' : 'Add Route'}
        description="Stops are saved in order. Add latitude and longitude when you want map-ready routing."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="route-form" disabled={loading}>
              {loading ? 'Saving...' : 'Save Route'}
            </Button>
          </>
        }
      >
        <form id="route-form" onSubmit={saveRoute} className="space-y-5">
          <AdminInput label="Route name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Morning Route A" />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white">Stops</h4>
                <p className="text-sm text-zinc-500">Add stops in pickup/drop order.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm((current) => ({ ...current, stops: [...current.stops, { label: '', lat: '', lng: '' }] }))}
              >
                <Plus size={16} />
                Add Stop
              </Button>
            </div>

            {form.stops.map((stop, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 md:grid-cols-[1fr_140px_140px_auto]">
                <AdminInput label={`Stop ${index + 1}`} value={stop.label} onChange={(event) => updateStop(index, { label: event.target.value })} placeholder="Stop name / landmark" />
                <AdminInput label="Latitude" value={stop.lat ?? ''} onChange={(event) => updateStop(index, { lat: event.target.value })} placeholder="17.3297" />
                <AdminInput label="Longitude" value={stop.lng ?? ''} onChange={(event) => updateStop(index, { lng: event.target.value })} placeholder="76.8343" />
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="mt-6 flex h-11 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                  aria-label="Remove stop"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <Card className="border-cyan-400/20 bg-cyan-400/5">
            <div className="flex items-start gap-3">
              <MapPinned size={18} className="mt-0.5 text-cyan-300" />
              <p className="text-sm text-zinc-400">
                Tip: use Google Maps to copy exact latitude/longitude for each stop. The live map page uses your configured Google API key.
              </p>
            </div>
          </Card>
        </form>
      </FormModal>
    </div>
  );
}
