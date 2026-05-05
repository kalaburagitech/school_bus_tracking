'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, UserRoundPen } from 'lucide-react';
import {
  AdminInput,
  AdminSelect,
  EmptyState,
  FormModal,
  SearchBar,
  shortId,
} from '@/components/admin/admin-controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/lib/session-context';

type Driver = {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  licenseNo?: string | null;
  experienceYears?: number | null;
  operationalStatus?: 'ACTIVE' | 'INACTIVE';
  drivenBuses?: Array<{ id: string; registrationNumber: string }>;
};

type DriverForm = {
  name: string;
  phone: string;
  email: string;
  licenseNo: string;
  experienceYears: string;
  operationalStatus: 'ACTIVE' | 'INACTIVE';
};

const emptyForm: DriverForm = {
  name: '',
  phone: '',
  email: '',
  licenseNo: '',
  experienceYears: '0',
  operationalStatus: 'ACTIVE',
};

export default function DriversPage() {
  const { api, tenantId, user } = useSession();
  const [rows, setRows] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (query = search) => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before managing driver records.');
      return;
    }
    try {
      const res = await api.listDrivers({ search: query, page: 1, pageSize: 80 });
      setRows((res.data as { data: Driver[] }).data ?? []);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void load(''));
    // Load on entry/tenant switch. Search is explicit so typing in forms never triggers reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name ?? '',
      phone: driver.phone,
      email: driver.email ?? '',
      licenseNo: driver.licenseNo ?? '',
      experienceYears: driver.experienceYears?.toString() ?? '0',
      operationalStatus: driver.operationalStatus ?? 'ACTIVE',
    });
    setModalOpen(true);
  };

  const saveDriver = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: form.name || undefined,
      phone: form.phone,
      email: form.email || undefined,
      licenseNo: form.licenseNo || undefined,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      operationalStatus: form.operationalStatus,
    };
    try {
      if (editing) {
        await api.updateDriver(editing.id, payload);
      } else {
        await api.createDriver(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-white">Drivers</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Driver mobile number is their OTP login identity. License and status help dispatch choose correctly.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Driver
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} onSearch={() => void load(search)} placeholder="Search phone, email, or driver" />
      {error ? <Card className="border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">{error}</Card> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Mobile login</th>
                <th className="px-5 py-3">License</th>
                <th className="px-5 py-3">Assigned bus</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((driver) => (
                <tr key={driver.id} className="text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{driver.name || 'Unnamed driver'}</div>
                    <div className="text-xs text-zinc-500">DID-{shortId(driver.id)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{driver.phone}</div>
                    <div className="text-xs text-zinc-500">{driver.email || 'no email'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{driver.licenseNo || '-'}</div>
                    <div className="text-xs text-zinc-500">{driver.experienceYears ?? 0} yrs exp.</div>
                  </td>
                  <td className="px-5 py-4">{driver.drivenBuses?.map((bus) => bus.registrationNumber).join(', ') || 'Unassigned'}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                      {driver.operationalStatus ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(driver)}>
                        <UserRoundPen size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await api.deleteDriver(driver.id);
                          await load();
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <EmptyState title="No drivers found" description="Add drivers with mobile numbers so they can login with OTP." /> : null}
      </Card>

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Driver' : 'Add Driver'}
        description="The phone number is the driver app login identity."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="driver-form" disabled={loading}>
              {loading ? 'Saving...' : 'Save Driver'}
            </Button>
          </>
        }
      >
        <form id="driver-form" onSubmit={saveDriver} className="grid gap-4 md:grid-cols-2">
          <AdminInput label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <AdminInput label="Mobile login" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" />
          <AdminInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AdminInput label="License number" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
          <AdminInput label="Experience years" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
          <AdminSelect label="Operational status" value={form.operationalStatus} onChange={(e) => setForm({ ...form, operationalStatus: e.target.value as DriverForm['operationalStatus'] })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </AdminSelect>
        </form>
      </FormModal>
    </div>
  );
}
