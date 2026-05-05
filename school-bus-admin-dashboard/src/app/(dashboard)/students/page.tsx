'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, UserRoundPen } from 'lucide-react';
import {
  AdminInput,
  AdminSelect,
  AdminTextarea,
  EmptyState,
  FormModal,
  SearchBar,
  shortId,
} from '@/components/admin/admin-controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/lib/session-context';

type Student = {
  id: string;
  name: string;
  studentClass?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  busId?: string | null;
  parentUserId?: string | null;
  bus?: { id: string; registrationNumber: string } | null;
  parent?: { id: string; phone: string; name?: string | null; email?: string | null } | null;
};

type BusOption = { id: string; registrationNumber: string; busNumber?: string | null };

type StudentForm = {
  firstName: string;
  lastName: string;
  studentClass: string;
  address: string;
  latitude: string;
  longitude: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  busId: string;
};

const emptyForm: StudentForm = {
  firstName: '',
  lastName: '',
  studentClass: '',
  address: '',
  latitude: '',
  longitude: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  busId: '',
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts.shift() ?? '',
    lastName: parts.join(' '),
  };
}

export default function StudentsPage() {
  const { api, tenantId, user } = useSession();
  const [rows, setRows] = useState<Student[]>([]);
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (query = search) => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before managing student records.');
      return;
    }
    try {
      const [studentRes, busRes] = await Promise.all([
        api.listStudents({ search: query, page: 1, pageSize: 80 }),
        api.listBuses({ page: 1, pageSize: 100 }),
      ]);
      setRows((studentRes.data as { data: Student[] }).data ?? []);
      setBuses((busRes.data as { data: BusOption[] }).data ?? []);
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

  const openEdit = (student: Student) => {
    const name = splitName(student.name);
    setEditing(student);
    setForm({
      firstName: name.firstName,
      lastName: name.lastName,
      studentClass: student.studentClass ?? '',
      address: student.address ?? '',
      latitude: student.latitude?.toString() ?? '',
      longitude: student.longitude?.toString() ?? '',
      parentName: student.parent?.name ?? '',
      parentPhone: student.parent?.phone ?? '',
      parentEmail: student.parent?.email ?? '',
      busId: student.busId ?? '',
    });
    setModalOpen(true);
  };

  const fullName = useMemo(
    () => `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    [form.firstName, form.lastName],
  );

  const saveStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName) return;
    setLoading(true);
    setError('');
    const payload = {
      name: fullName,
      studentClass: form.studentClass || undefined,
      address: form.address || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      parentName: form.parentName || undefined,
      parentPhone: form.parentPhone || undefined,
      parentEmail: form.parentEmail || undefined,
      busId: form.busId || undefined,
    };
    try {
      if (editing) {
        await api.updateStudent(editing.id, payload);
      } else {
        await api.createStudent(payload);
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
          <h2 className="text-3xl font-semibold text-white">Students</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Manage student identity, parent login phone, pickup location, and assigned bus.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Student
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        onSearch={() => void load(search)}
        placeholder="Search by student name"
      />

      {error ? (
        <Card className="border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">{error}</Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Parent login</th>
                <th className="px-5 py-3">Bus</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((student) => (
                <tr key={student.id} className="text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{student.name}</div>
                    <div className="text-xs text-zinc-500">SID-{shortId(student.id)}</div>
                  </td>
                  <td className="px-5 py-4">{student.studentClass || '-'}</td>
                  <td className="px-5 py-4">
                    <div>{student.parent?.phone ?? 'Not linked'}</div>
                    <div className="text-xs text-zinc-500">{student.parent?.name ?? student.parent?.email ?? ''}</div>
                  </td>
                  <td className="px-5 py-4">{student.bus?.registrationNumber ?? 'Unassigned'}</td>
                  <td className="max-w-xs truncate px-5 py-4">{student.address || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(student)}>
                        <UserRoundPen size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await api.deleteStudent(student.id);
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
        {rows.length === 0 ? (
          <EmptyState title="No students found" description="Add students with parent mobile numbers to enable parent login." />
        ) : null}
      </Card>

      <FormModal
        open={modalOpen}
        title={editing ? 'Edit Student' : 'Add Student'}
        description="Use parent phone to create or link the parent login automatically."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="student-form" disabled={loading}>
              {loading ? 'Saving...' : 'Save Student'}
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={saveStudent} className="grid gap-4 md:grid-cols-2">
          <AdminInput label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <AdminInput label="Last name / family name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <AdminInput label="Class / section" value={form.studentClass} onChange={(e) => setForm({ ...form, studentClass: e.target.value })} />
          <AdminSelect label="Assigned bus" value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })}>
            <option value="">Unassigned</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.registrationNumber} {bus.busNumber ? `(${bus.busNumber})` : ''}
              </option>
            ))}
          </AdminSelect>
          <AdminInput label="Parent name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
          <AdminInput label="Parent mobile login" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+919876543210" />
          <AdminInput label="Parent email" type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <AdminInput label="Latitude" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            <AdminInput label="Longitude" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </div>
          <AdminTextarea label="Pickup / drop address" className="md:col-span-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </form>
      </FormModal>
    </div>
  );
}
