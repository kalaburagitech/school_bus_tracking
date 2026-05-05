import type { Role } from '@prisma/client';

export interface JwtPayload {
  userId?: string;
  sub: string;
  role: Role;
  tenantId: string | null;
  /** Super admin may impersonate a tenant for WS/API scope */
  impersonateTenantId?: string | null;
}
