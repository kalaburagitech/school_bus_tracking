import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { resolveEffectiveTenantId } from './resolve-effective-tenant';
import type { JwtPayload } from '../types/jwt-payload.types';

describe('resolveEffectiveTenantId', () => {
  it('returns tenant from JWT for school admin', () => {
    const user: JwtPayload = {
      sub: 'u1',
      role: Role.SCHOOL_ADMIN,
      tenantId: 't1',
    };
    expect(resolveEffectiveTenantId(user)).toBe('t1');
  });

  it('requires X-Tenant-Id for super admin', () => {
    const user: JwtPayload = {
      sub: 'u1',
      role: Role.SUPER_ADMIN,
      tenantId: null,
    };
    expect(() => resolveEffectiveTenantId(user)).toThrow(BadRequestException);
    expect(resolveEffectiveTenantId(user, 't2')).toBe('t2');
  });

  it('throws when non-super user has no tenant', () => {
    const user: JwtPayload = {
      sub: 'u1',
      role: Role.DRIVER,
      tenantId: null,
    };
    expect(() => resolveEffectiveTenantId(user)).toThrow(ForbiddenException);
  });
});
