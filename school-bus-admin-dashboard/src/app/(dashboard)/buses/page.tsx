'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BusFront, Plus, Trash2, UserPlus } from 'lucide-react';
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

type Bus = {
  id: string;
  registrationNumber: string;
  busNumber?: string | null;
  vehicleNumber?: string | null;
  capacity: number;
  driverUserId?: string | null;
  driver?: { id: string; phone: string; name?: string | null } | null;
  students?: Array<{ id: string; name: string; parent?: { phone: string } | null }>;
};

type Driver = { id: string; name?: string | null; phone: string; licenseNo?: string | null };
type Student = { id: string; name: string; busId?: string | null; parent?: { phone: string } | null };
type Pagination = { total: number; page: number; pageSize: number };

type BusForm = {
  registrationNumber: string;
  busNumber: string;
  vehicleNumber: string;
  capacity: string;
  driverUserId: string;
};

function getErrorMessage(err: unknown) {
  const maybeAxios = err as {
    response?: { status?: number; data?: { message?: string | string[] } | string };
    message?: string;
  };
  const message = maybeAxios.response?.data
    ? typeof maybeAxios.response.data === 'string'
      ? maybeAxios.response.data
      : Array.isArray(maybeAxios.response.data.message)
        ? maybeAxios.response.data.message.join(', ')
        : maybeAxios.response.data.message
    : maybeAxios.message;
  return message
    ? `${maybeAxios.response?.status ? `HTTP ${maybeAxios.response.status}: ` : ''}${message}`
    : 'Unexpected request failure';
}

const emptyBus: BusForm = {
  registrationNumber: '',
  busNumber: '',
  vehicleNumber: '',
  capacity: '40',
  driverUserId: '',
};

export default function BusesPage() {
  const { api, tenantId, user } = useSession();
  const [rows, setRows] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [busPage, setBusPage] = useState(1);
  const [busPagination, setBusPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20 });
  const [driverPagination, setDriverPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20 });
  const [studentPagination, setStudentPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20 });
  const [busForm, setBusForm] = useState<BusForm>(emptyBus);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [modal, setModal] = useState<'bus' | 'assign' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helperText, setHelperText] = useState('');

  const load = async (query = search, page = busPage) => {
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before managing fleet records.');
      return;
    }
    const [busResult, driverResult, studentResult] = await Promise.allSettled([
      api.listBuses({ search: query, page, pageSize: 20 }),
      api.listDrivers({ page: 1, pageSize: 20 }),
      api.listStudents({ page: 1, pageSize: 20 }),
    ]);

    const messages: string[] = [];
    if (busResult.status === 'fulfilled') {
      const data = busResult.value.data as { data: Bus[]; pagination?: Pagination };
      setRows(data.data ?? []);
      setBusPagination(data.pagination ?? { total: data.data?.length ?? 0, page, pageSize: 20 });
      setBusPage(page);
    } else {
      setRows([]);
      messages.push(`Buses: ${getErrorMessage(busResult.reason)}`);
    }

    if (driverResult.status === 'fulfilled') {
      const data = driverResult.value.data as { data: Driver[]; pagination?: Pagination };
      setDrivers(data.data ?? []);
      setDriverPagination(data.pagination ?? { total: data.data?.length ?? 0, page: 1, pageSize: 20 });
    } else {
      setDrivers([]);
      messages.push(`Drivers: ${getErrorMessage(driverResult.reason)}`);
    }

    if (studentResult.status === 'fulfilled') {
      const data = studentResult.value.data as { data: Student[]; pagination?: Pagination };
      setStudents(data.data ?? []);
      setStudentPagination(data.pagination ?? { total: data.data?.length ?? 0, page: 1, pageSize: 20 });
    } else {
      setStudents([]);
      messages.push(`Students: ${getErrorMessage(studentResult.reason)}`);
    }

    setError(messages.join(' | '));
    setHelperText(
      messages.length
        ? 'Some fleet data could not load. Check tenant selection and backend auth.'
        : 'Loaded fleet data. Assignment search is server-backed and paginated for larger data.',
    );
  };

  const searchDrivers = async (query = driverSearch, page = 1) => {
    try {
      const res = await api.listDrivers({ search: query, page, pageSize: 20 });
      const data = res.data as { data: Driver[]; pagination?: Pagination };
      setDrivers(data.data ?? []);
      setDriverPagination(data.pagination ?? { total: data.data?.length ?? 0, page, pageSize: 20 });
      setError('');
    } catch (err) {
      setError(`Drivers: ${getErrorMessage(err)}`);
    }
  };

  const searchStudents = async (query = studentSearch, page = 1) => {
    try {
      const res = await api.listStudents({ search: query, page, pageSize: 20 });
      const data = res.data as { data: Student[]; pagination?: Pagination };
      setStudents(data.data ?? []);
      setStudentPagination(data.pagination ?? { total: data.data?.length ?? 0, page, pageSize: 20 });
      setError('');
    } catch (err) {
      setError(`Students: ${getErrorMessage(err)}`);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void load(''));
    // Load on entry/tenant switch. Search is explicit so typing in forms never triggers reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase();
    return drivers.filter((driver) =>
      `${driver.name ?? ''} ${driver.phone} ${driver.licenseNo ?? ''}`.toLowerCase().includes(q),
    );
  }, [drivers, driverSearch]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return students.filter((student) =>
      `${student.name} ${student.parent?.phone ?? ''} ${shortId(student.id)}`.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const openBusModal = () => {
    setBusForm(emptyBus);
    setSelectedBus(null);
    setModal('bus');
  };

  const openAssignModal = (bus: Bus) => {
    setSelectedBus(bus);
    setDriverSearch('');
    setStudentSearch('');
    setModal('assign');
    void searchDrivers('', 1);
    void searchStudents('', 1);
  };

  const saveBus = async (event: FormEvent) => {
    event.preventDefault();
    if (user?.role === 'SUPER_ADMIN' && !tenantId) {
      setError('Select a tenant from the header before adding a bus.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createBus({
        registrationNumber: busForm.registrationNumber,
        busNumber: busForm.busNumber || undefined,
        vehicleNumber: busForm.vehicleNumber || undefined,
        capacity: busForm.capacity ? Number(busForm.capacity) : undefined,
        driverUserId: busForm.driverUserId || undefined,
      });
      setModal(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const assignToBus = async (payload: { driverUserId?: string; studentId?: string }) => {
    if (!selectedBus) return;
    setLoading(true);
    setError('');
    try {
      if (payload.driverUserId !== undefined) {
        await api.applyAssignments({
          assignDriverBus: { driverUserId: payload.driverUserId, busId: selectedBus.id },
        });
      }
      if (payload.studentId) {
        await api.applyAssignments({
          assignStudentBus: { studentId: payload.studentId, busId: selectedBus.id },
        });
      }
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-white">Fleet</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create buses, assign drivers, and attach students using searchable live data instead of manual IDs.
          </p>
        </div>
        <Button onClick={openBusModal}>
          <Plus size={16} />
          Add Bus
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} onSearch={() => void load(search, 1)} placeholder="Search bus registration" />
      {error ? <Card className="border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">{error}</Card> : null}
      {helperText ? <p className="text-sm text-zinc-500">{helperText}</p> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">Bus</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((bus) => (
                <tr key={bus.id} className="text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                        <BusFront size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{bus.registrationNumber}</div>
                        <div className="text-xs text-zinc-500">
                          BUS-{shortId(bus.id)} {bus.busNumber ? `| ${bus.busNumber}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{bus.capacity}</td>
                  <td className="px-5 py-4">
                    <div>{bus.driver?.name ?? bus.driver?.phone ?? 'Unassigned'}</div>
                    <div className="text-xs text-zinc-500">{bus.driver?.phone ?? ''}</div>
                  </td>
                  <td className="px-5 py-4">{bus.students?.length ?? 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openAssignModal(bus)}>
                        <UserPlus size={16} />
                        Assign
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await api.deleteBus(bus.id);
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
        {rows.length === 0 ? <EmptyState title="No buses found" description="Add buses before assigning drivers and students." /> : null}
      </Card>

      <div className="flex flex-col gap-3 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
        <span>
          Showing page {busPagination.page} · {rows.length} of {busPagination.total} buses
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busPagination.page <= 1}
            onClick={() => void load(search, busPagination.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={busPagination.page * busPagination.pageSize >= busPagination.total}
            onClick={() => void load(search, busPagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <FormModal
        open={modal === 'bus'}
        title="Add Bus"
        description="Registration number is the primary fleet identifier."
        onClose={() => setModal(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" form="bus-form" disabled={loading}>
              {loading ? 'Saving...' : 'Save Bus'}
            </Button>
          </>
        }
      >
        <form id="bus-form" onSubmit={saveBus} className="grid gap-4 md:grid-cols-2">
          <AdminInput label="Registration number" required value={busForm.registrationNumber} onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })} />
          <AdminInput label="Bus number" value={busForm.busNumber} onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })} />
          <AdminInput label="Vehicle number" value={busForm.vehicleNumber} onChange={(e) => setBusForm({ ...busForm, vehicleNumber: e.target.value })} />
          <AdminInput label="Capacity" type="number" min={1} value={busForm.capacity} onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })} />
          <AdminSelect label="Initial driver" value={busForm.driverUserId} onChange={(e) => setBusForm({ ...busForm, driverUserId: e.target.value })}>
            <option value="">
              {drivers.length ? 'Unassigned' : 'No drivers available - add driver first'}
            </option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name || driver.phone} | {driver.phone}
              </option>
            ))}
          </AdminSelect>
        </form>
      </FormModal>

      <FormModal
        open={modal === 'assign'}
        title={`Assign ${selectedBus?.registrationNumber ?? 'Bus'}`}
        description="Search and select real records from this tenant. No manual IDs needed."
        onClose={() => setModal(null)}
        footer={<Button variant="secondary" onClick={() => setModal(null)}>Done</Button>}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminInput
                className="flex-1"
                label="Search drivers"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void searchDrivers(driverSearch, 1);
                }}
                placeholder="Name, phone, license"
              />
              <Button className="mt-6" type="button" variant="secondary" onClick={() => void searchDrivers(driverSearch, 1)}>
                Search
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void assignToBus({ driverUserId: driver.id })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">{driver.name || 'Unnamed driver'}</div>
                  <div className="text-xs text-zinc-500">
                    {driver.phone} | DID-{shortId(driver.id)}
                  </div>
                </button>
              ))}
              {filteredDrivers.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-500">
                  No drivers found. Add a driver first or search another phone/name.
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{driverPagination.total} drivers</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={driverPagination.page <= 1}
                  onClick={() => void searchDrivers(driverSearch, driverPagination.page - 1)}
                  className="disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={driverPagination.page * driverPagination.pageSize >= driverPagination.total}
                  onClick={() => void searchDrivers(driverSearch, driverPagination.page + 1)}
                  className="disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminInput
                className="flex-1"
                label="Search students"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void searchStudents(studentSearch, 1);
                }}
                placeholder="Name, parent phone, ID"
              />
              <Button className="mt-6" type="button" variant="secondary" onClick={() => void searchStudents(studentSearch, 1)}>
                Search
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void assignToBus({ studentId: student.id })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">{student.name}</div>
                  <div className="text-xs text-zinc-500">
                    SID-{shortId(student.id)} | {student.parent?.phone ?? 'no parent phone'} | {student.busId ? 'assigned' : 'unassigned'}
                  </div>
                </button>
              ))}
              {filteredStudents.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-500">
                  No students found. Add students first or search another name/parent phone.
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{studentPagination.total} students</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={studentPagination.page <= 1}
                  onClick={() => void searchStudents(studentSearch, studentPagination.page - 1)}
                  className="disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={studentPagination.page * studentPagination.pageSize >= studentPagination.total}
                  onClick={() => void searchStudents(studentSearch, studentPagination.page + 1)}
                  className="disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
