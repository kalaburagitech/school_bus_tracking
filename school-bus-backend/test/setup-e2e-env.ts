/**
 * Runs before e2e test files load. Set RUN_E2E=1 and start Postgres + Redis
 * (e.g. `docker compose up -d`) for integration checks.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/school_bus?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-32chars-minimum!!';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-32chars-minimum!';
process.env.KAFKA_DISABLED = process.env.KAFKA_DISABLED ?? '1';
process.env.OTP_DEV_CODE = process.env.OTP_DEV_CODE ?? '123456';
