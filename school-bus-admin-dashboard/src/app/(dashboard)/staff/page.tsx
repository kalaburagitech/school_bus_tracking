'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, UserRoundPen } from 'lucide-react';
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

type StaffRow = {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  licenseNo?: string | null;
  experienceYears?: number | null;
};

type StaffForm = {
  name: string;
  phone: string;
  email: string;
  roleTitle: string;
  experienceYears: string;
};

const emptyForm: StaffForm = {
  name: '',
  phone: '',
  email: '',
  roleTitle: '',
  experienceYears: '0',
};

export default function StaffPage() {
  const { api, tenantId, user } = useSession();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async (query = search) => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before managing staff records.');
      return;
    }
    try {
      const res = await api.listStaff({ search: query, page: 1, pageSize: 80 });
      setRows(((res.data as { data: StaffRow[] }).data ?? []) as StaffRow[]);
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
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (staff: StaffRow) => {
    setEditing(staff);
    setForm({
      name: staff.name ?? '',
      phone: staff.phone,
      email: staff.email ?? '',
      roleTitle: staff.licenseNo ?? '',
      experienceYears: staff.experienceYears?.toString() ?? '0',
    });
    setModalOpen(true);
  };

  const saveStaff = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      roleTitle: form.roleTitle || undefined,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
    };
    try {
      if (editing) {
        await api.updateStaff(editing.id, payload);
      } else {
        await api.createStaff(payload);
      }
      setModalOpen(false);
      await reload();
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
          <h2 className="text-3xl font-semibold text-white">Staff</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Add attendants, transport coordinators, and support staff with searchable IDs and contact details.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Staff
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} onSearch={() => void reload(search)} placeholder="Search name or phone" />
      {error ? <Card className="border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">{error}</Card> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Experience</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className="text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{row.name ?? 'Unnamed staff'}</div>
                    <div className="text-xs text-zinc-500">STF-{shortId(row.id)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{row.phone}</div>
                    <div className="text-xs text-zinc-500">{row.email || 'no email'}</div>
                  </td>
                  <td className="px-5 py-4">{row.licenseNo || 'Transport Staff'}</td>
                  <td className="px-5 py-4">{row.experienceYears ?? 0} yrs</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(row)}>
                        <UserRoundPen size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await api.deleteStaff(row.id);
                          await reload();
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
        {rows.length === 0 ? <EmptyState title="No staff found" description="Add staff members and assign them to buses from Fleet." /> : null}
      </Card>

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Staff' : 'Add Staff'}
        description="Replace browser alerts with a complete controlled form."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form" disabled={loading}>
              {loading ? 'Saving...' : 'Save Staff'}
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={saveStaff} className="grid gap-4 md:grid-cols-2">
          <AdminInput label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <AdminInput label="Mobile" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" />
          <AdminInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AdminInput label="Role title" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} placeholder="Bus attendant" />
          <AdminInput label="Experience years" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
        </form>
      </FormModal>
    </div>
  );
}
