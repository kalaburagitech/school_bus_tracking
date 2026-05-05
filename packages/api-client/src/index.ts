import axios, { AxiosError, type AxiosInstance } from 'axios';

export type SessionProvider = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  getTenantId: () => string | null;
  onUnauthenticated?: () => void;
};

export type NormalizedApiError = {
  status: number;
  message: string;
  code: string;
};

export function normalizeApiError(error: unknown): NormalizedApiError {
  const axiosErr = error as AxiosError<{ message?: string | string[]; error?: string }>;
  const status = axiosErr.response?.status ?? 0;
  const payloadMessage = axiosErr.response?.data?.message;
  const message = Array.isArray(payloadMessage)
    ? payloadMessage.join(', ')
    : payloadMessage || axiosErr.message || 'Request failed';
  return {
    status,
    message,
    code: axiosErr.response?.data?.error ?? 'API_ERROR',
  };
}

export function createApiClient(baseURL: string, session: SessionProvider): AxiosInstance {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = session.getAccessToken();
    const tenantId = session.getTenantId();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    return config;
  });

  let isRefreshing = false;
  let queue: Array<() => void> = [];

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config;
      if (!original || error.response?.status !== 401) {
        return Promise.reject(error);
      }
      const requestUrl = String(original.url ?? '');
      const isAuthRoute =
        requestUrl.includes('/auth/request-otp') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/refresh');
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if ((original as { _retry?: boolean })._retry) {
        session.onUnauthenticated?.();
        return Promise.reject(error);
      }
      (original as { _retry?: boolean })._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => {
          queue.push(resolve);
        });
        return client(original);
      }

      isRefreshing = true;
      try {
        const refreshToken = session.getRefreshToken();
        if (!refreshToken) {
          session.onUnauthenticated?.();
          return Promise.reject(error);
        }
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        const accessToken = (refreshRes.data as { accessToken: string }).accessToken;
        const newRefresh = (refreshRes.data as { refreshToken?: string }).refreshToken;
        session.setTokens(accessToken, newRefresh);
        queue.forEach((r) => r());
        queue = [];
        return client(original);
      } catch (refreshError) {
        session.onUnauthenticated?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}

export type AdminStudent = {
  id: string;
  name: string;
  studentClass?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  busId?: string | null;
  parentUserId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
};

export function createAdminApi(client: AxiosInstance) {
  return {
    requestOtp: (phone: string) => client.post('/auth/request-otp', { phone }),
    verifyOtp: (phone: string, code: string, impersonateTenantId?: string) =>
      client.post('/auth/verify-otp', { phone, code, impersonateTenantId }),
    dashboardSummary: () => client.get('/admin/dashboard/summary'),
    listStudents: (params?: Record<string, unknown>) =>
      client.get('/admin/students', { params }),
    createStudent: (payload: Partial<AdminStudent>) => client.post('/admin/students', payload),
    updateStudent: (id: string, payload: Partial<AdminStudent>) =>
      client.patch(`/admin/students/${id}`, payload),
    deleteStudent: (id: string) => client.delete(`/admin/students/${id}`),
    listDrivers: (params?: Record<string, unknown>) =>
      client.get('/admin/drivers', { params }),
    createDriver: (payload: {
      name?: string;
      phone: string;
      email?: string;
      licenseNo?: string;
      experienceYears?: number;
      operationalStatus?: 'ACTIVE' | 'INACTIVE';
    }) =>
      client.post('/admin/drivers', payload),
    updateDriver: (
      id: string,
      payload: {
        name?: string;
        phone?: string;
        email?: string | null;
        licenseNo?: string;
        experienceYears?: number;
        operationalStatus?: 'ACTIVE' | 'INACTIVE';
      },
    ) =>
      client.patch(`/admin/drivers/${id}`, payload),
    deleteDriver: (id: string) => client.delete(`/admin/drivers/${id}`),
    listBuses: (params?: Record<string, unknown>) => client.get('/admin/buses', { params }),
    createBus: (payload: Record<string, unknown>) => client.post('/admin/buses', payload),
    updateBus: (id: string, payload: Record<string, unknown>) =>
      client.patch(`/admin/buses/${id}`, payload),
    deleteBus: (id: string) => client.delete(`/admin/buses/${id}`),
    listLiveBuses: () => client.get('/admin/buses/live'),
    applyAssignments: (payload: Record<string, unknown>) =>
      client.post('/admin/assignments', payload),
    listStaff: (params?: Record<string, unknown>) => client.get('/admin/staff', { params }),
    createStaff: (payload: Record<string, unknown>) => client.post('/admin/staff', payload),
    updateStaff: (id: string, payload: Record<string, unknown>) =>
      client.patch(`/admin/staff/${id}`, payload),
    deleteStaff: (id: string) => client.delete(`/admin/staff/${id}`),
    listAttendanceLogs: (params?: Record<string, unknown>) =>
      client.get('/admin/attendance-logs', { params }),
    listRoutes: () => client.get('/admin/routes'),
    createRoute: (payload: Record<string, unknown>) => client.post('/admin/routes', payload),
    updateRoute: (id: string, payload: Record<string, unknown>) =>
      client.patch(`/admin/routes/${id}`, payload),
  };
}

export function createOrganizationsApi(client: AxiosInstance) {
  return {
    listOrganizations: (params?: Record<string, unknown>) =>
      client.get('/organizations', { params }),
    listSwitcherTenants: () => client.get('/organizations/switcher'),
    getOrganizationDetails: (id: string) => client.get(`/organizations/${id}`),
    createOrganization: (payload: Record<string, unknown>) =>
      client.post('/organizations', payload),
    updateOrganization: (id: string, payload: Record<string, unknown>) =>
      client.patch(`/organizations/${id}`, payload),
    deleteOrganization: (id: string) => client.delete(`/organizations/${id}`),
  };
}
