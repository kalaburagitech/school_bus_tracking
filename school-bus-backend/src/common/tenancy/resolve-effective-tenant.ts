import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload.types';

export function resolveEffectiveTenantId(
  user: JwtPayload,
  xTenantIdHeader?: string | string[],
): string {
  if (user.role === 'SUPER_ADMIN') {
    const raw = Array.isArray(xTenantIdHeader)
      ? xTenantIdHeader[0]
      : xTenantIdHeader;
    if (!raw?.trim()) {
      throw new BadRequestException(
        'X-Tenant-Id header is required for tenant-scoped operation',
      );
    }
    return raw.trim();
  }
  if (!user.tenantId) {
    throw new ForbiddenException('No tenant associated with this account');
  }
  return user.tenantId;
}
