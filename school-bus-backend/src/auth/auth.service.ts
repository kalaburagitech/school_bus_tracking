import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import type { Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

interface RefreshJwtPayload {
  sub: string;
  rtid: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(phone: string): Promise<{ ok: true; ttlSeconds: number }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('No account for this phone');
    }

    const devCode = this.config.get<string>('otp.devCode', '');
    const code =
      devCode && devCode.length >= 4
        ? devCode
        : String(Math.floor(100000 + Math.random() * 900000));

    const ttl = this.config.get<number>('otp.ttlSeconds', 300);
    await this.redis.client.setex(this.redis.otpKey(phone), ttl, code);

    return { ok: true, ttlSeconds: ttl };
  }

  async verifyOtp(
    phone: string,
    code: string,
    impersonateTenantId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInSec: number;
    user: { id: string; role: Role; tenantId: string | null };
  }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('No account for this phone');
    }

    const devCode = this.config.get<string>('otp.devCode', '');
    const stored = await this.redis.client.get(this.redis.otpKey(phone));
    const valid =
      (stored && stored === code) ||
      (devCode && devCode === code) ||
      (this.config.get('nodeEnv') === 'test' && code === '000000');

    if (!valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redis.client.del(this.redis.otpKey(phone));

    let impersonate: string | null = null;
    if (user.role === 'SUPER_ADMIN' && impersonateTenantId) {
      const t = await this.prisma.tenant.findUnique({
        where: { id: impersonateTenantId },
      });
      if (!t) {
        throw new BadRequestException('Invalid impersonateTenantId');
      }
      impersonate = impersonateTenantId;
    }
    if (user.role !== 'SUPER_ADMIN' && !user.tenantId) {
      throw new UnauthorizedException('No tenant associated with this account');
    }

    const accessPayload: JwtPayload = {
      userId: user.id,
      sub: user.id,
      role: user.role,
      tenantId: user.role === 'SUPER_ADMIN' ? null : user.tenantId,
      impersonateTenantId: impersonate,
    };

    const accessExpiresSec = this.config.get<number>(
      'jwt.accessExpiresSec',
      900,
    );
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessExpiresSec,
    });

    const refreshExpiresSec = this.config.get<number>(
      'jwt.refreshExpiresSec',
      604800,
    );
    const expiresAt = new Date(Date.now() + refreshExpiresSec * 1000);

    const row = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt,
      },
    });

    const refreshPayload: RefreshJwtPayload = {
      sub: user.id,
      rtid: row.id,
      type: 'refresh',
    };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresSec,
    });
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { tokenHash },
    });

    return {
      accessToken,
      refreshToken,
      expiresInSec: accessExpiresSec,
      user: {
        id: user.id,
        role: user.role,
        tenantId: user.role === 'SUPER_ADMIN' ? null : user.tenantId,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let decoded: RefreshJwtPayload;
    try {
      decoded = this.jwt.verify<RefreshJwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (decoded.type !== 'refresh' || !decoded.rtid || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const row = await this.prisma.refreshToken.findFirst({
      where: {
        id: decoded.rtid,
        userId: decoded.sub,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!row) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const valid = await bcrypt.compare(refreshToken, row.tokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: row.id } });

    const user = row.user;
    if (user.role !== 'SUPER_ADMIN' && !user.tenantId) {
      throw new UnauthorizedException('No tenant associated with this account');
    }
    const accessPayload: JwtPayload = {
      userId: user.id,
      sub: user.id,
      role: user.role,
      tenantId: user.role === 'SUPER_ADMIN' ? null : user.tenantId,
    };

    const accessExpiresSec = this.config.get<number>(
      'jwt.accessExpiresSec',
      900,
    );
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessExpiresSec,
    });

    const refreshExpiresSec = this.config.get<number>(
      'jwt.refreshExpiresSec',
      604800,
    );
    const expiresAt = new Date(Date.now() + refreshExpiresSec * 1000);
    const newRow = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt,
      },
    });
    const refreshPayload: RefreshJwtPayload = {
      sub: user.id,
      rtid: newRow.id,
      type: 'refresh',
    };
    const newRefresh = this.jwt.sign(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresSec,
    });
    await this.prisma.refreshToken.update({
      where: { id: newRow.id },
      data: { tokenHash: await bcrypt.hash(newRefresh, BCRYPT_ROUNDS) },
    });

    return { accessToken, refreshToken: newRefresh };
  }
}
