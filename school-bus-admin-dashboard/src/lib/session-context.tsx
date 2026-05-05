'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminApi, createApiClient, createOrganizationsApi } from '@schoolbus/api-client';

type SessionUser = {
  id: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT' | 'STUDENT' | 'STAFF';
  tenantId: string | null;
};

type SessionCtx = {
  isHydrated: boolean;
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  user: SessionUser | null;
  setTenantId: (value: string) => void;
  login: (payload: {
    accessToken: string;
    refreshToken: string;
    user: SessionUser;
    tenantId: string;
  }) => void;
  logout: () => void;
  api: ReturnType<typeof createAdminApi>;
  orgApi: ReturnType<typeof createOrganizationsApi>;
};

const Context = createContext<SessionCtx | null>(null);

function readStorage(key: string) {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(key) ?? '';
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [tenantId, setTenantIdState] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setAccessToken(readStorage('admin.accessToken'));
      setRefreshToken(readStorage('admin.refreshToken'));
      setTenantIdState(readStorage('admin.tenantId'));
      const rawUser = readStorage('admin.user');
      setUser(rawUser ? (JSON.parse(rawUser) as SessionUser) : null);
      setIsHydrated(true);
    });
  }, []);

  const session = useMemo(() => {
    const apiClient = createApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
      {
        getAccessToken: () => accessToken || null,
        getRefreshToken: () => refreshToken || null,
        setTokens: (nextAccessToken, nextRefreshToken) => {
          setAccessToken(nextAccessToken);
          localStorage.setItem('admin.accessToken', nextAccessToken);
          if (nextRefreshToken) {
            setRefreshToken(nextRefreshToken);
            localStorage.setItem('admin.refreshToken', nextRefreshToken);
          }
        },
        getTenantId: () => (user?.role === 'SUPER_ADMIN' ? tenantId || null : null),
        onUnauthenticated: () => {
          localStorage.removeItem('admin.accessToken');
          localStorage.removeItem('admin.refreshToken');
          localStorage.removeItem('admin.user');
          setAccessToken('');
          setRefreshToken('');
          setUser(null);
          router.replace('/login');
        },
      },
    );

    const api = createAdminApi(apiClient);
    const orgApi = createOrganizationsApi(apiClient);

    return {
      isHydrated,
      accessToken,
      refreshToken,
      tenantId,
      user,
      setTenantId: (value: string) => {
        setTenantIdState(value);
        localStorage.setItem('admin.tenantId', value);
      },
      login: (payload: {
        accessToken: string;
        refreshToken: string;
        user: SessionUser;
        tenantId: string;
      }) => {
        setAccessToken(payload.accessToken);
        setRefreshToken(payload.refreshToken);
        setUser(payload.user);
        setTenantIdState(payload.tenantId);
        localStorage.setItem('admin.accessToken', payload.accessToken);
        localStorage.setItem('admin.refreshToken', payload.refreshToken);
        localStorage.setItem('admin.user', JSON.stringify(payload.user));
        localStorage.setItem('admin.tenantId', payload.tenantId);
      },
      logout: () => {
        localStorage.removeItem('admin.accessToken');
        localStorage.removeItem('admin.refreshToken');
        localStorage.removeItem('admin.user');
        localStorage.removeItem('admin.tenantId');
        setAccessToken('');
        setRefreshToken('');
        setUser(null);
        setTenantIdState('');
        router.replace('/login');
      },
      api,
      orgApi,
    };
  }, [accessToken, refreshToken, tenantId, user, router, isHydrated]);

  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
