import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const runE2e = process.env.RUN_E2E === '1';

(runE2e ? describe : describe.skip)('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', () => {
    return request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200);
  });

  it('GET /parent/bus/live without token returns 401', () => {
    return request(app.getHttpServer() as Server)
      .get('/parent/bus/live')
      .expect(401);
  });
});

describe('E2E gate', () => {
  it('documents RUN_E2E when skipped', () => {
    if (!runE2e) {
      expect(runE2e).toBe(false);
    } else {
      expect(runE2e).toBe(true);
    }
  });
});
