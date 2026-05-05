import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { findUnique: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };
  const redis = {
    otpKey: (phone: string) => `otp:${phone}`,
    liveBusKey: jest.fn(),
    client: {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn(), verify: jest.fn() };
  const config = {
    get: jest.fn((key: string, def?: unknown) => {
      const map: Record<string, unknown> = {
        'otp.devCode': '',
        'otp.ttlSeconds': 300,
        'jwt.accessSecret': 'a'.repeat(32),
        'jwt.refreshSecret': 'b'.repeat(32),
        'jwt.accessExpiresSec': 900,
        'jwt.refreshExpiresSec': 604800,
        nodeEnv: 'test',
      };
      return map[key] ?? def;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'a'.repeat(32);
      if (key === 'jwt.refreshSecret') return 'b'.repeat(32);
      throw new Error(`missing ${key}`);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('requestOtp throws when user missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.requestOtp('+1000')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('verifyOtp rejects bad code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+1000',
      role: Role.PARENT,
      tenantId: 't1',
    });
    redis.client.get.mockResolvedValue(null);
    await expect(service.verifyOtp('+1000', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('verifyOtp accepts test code 000000 in test env', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+1000',
      role: Role.PARENT,
      tenantId: 't1',
    });
    redis.client.get.mockResolvedValue(null);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });
    jwt.sign
      .mockReturnValueOnce('access.jwt')
      .mockReturnValueOnce('refresh.jwt');
    prisma.refreshToken.update.mockResolvedValue({});

    const out = await service.verifyOtp('+1000', '000000');
    expect(out.accessToken).toBe('access.jwt');
    expect(out.refreshToken).toBe('refresh.jwt');
    expect(redis.client.del).toHaveBeenCalled();
  });
});
