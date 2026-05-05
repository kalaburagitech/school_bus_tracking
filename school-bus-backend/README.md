# School Bus Backend

Production-oriented **multi-tenant** API for school transport: OTP + JWT auth, driver GPS + attendance (Kafka or inline), parent live view, school admin assignments.

## Stack

- **NestJS** 11 + TypeScript  
- **PostgreSQL** + **Prisma** 5  
- **Redis** (OTP, live bus cache)  
- **Kafka** + **kafkajs** (tracking pipeline; disable with `KAFKA_DISABLED=1`)  
- **Socket.IO** (`/realtime` namespace)  
- **Swagger** at `/docs`

## Quick start

```bash
cp .env.example .env
# Set JWT secrets (32+ chars), DATABASE_URL, REDIS_URL
# For laptop without Kafka:
#   KAFKA_DISABLED=1

docker compose up -d
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

Demo users (after seed):

| Role | Phone |
|------|--------|
| Super Admin | `+10000000001` |
| School Admin | `+10000000002` |
| Driver | `+10000000003` |
| Parent | `+10000000004` |

Use `POST /auth/request-otp` then `POST /auth/verify-otp` with the OTP from Redis, or set `OTP_DEV_CODE` in `.env` for a fixed code.

Super admin HTTP routes that need a tenant scope require header **`X-Tenant-Id: <tenant id>`** (see seed log for `tenantId`). For WebSocket, pass `impersonateTenantId` in `verify-otp` when logging in as super admin.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `RUN_E2E=1 npm run test:e2e` | API e2e (needs DB + Redis) |
| `npm run prisma:migrate` | Apply migrations (deploy) |
| `npm run prisma:seed` | Seed demo tenant |

## API map (Phase 1)

- `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/refresh`
- `POST /driver/trips/start`, `POST /driver/trips/location`, `POST /driver/trips/attendance`
- `GET /parent/bus/live`, `GET /parent/history?from=&to=`
- `GET /admin/students`, `GET /admin/buses/live`, `POST /admin/assignments`
- `GET /health`

Full contract: **`/docs`** (OpenAPI).

## Docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Docker, Railway, Kafka, e2e  
- [docs/openapi.yaml](docs/openapi.yaml) — static summary (use `/docs` as source of truth)

## Security

- Never commit `.env` or real credentials.  
- Use strong JWT secrets and disable `OTP_DEV_CODE` in production.  
- Enforce TLS to Postgres/Redis/Kafka in production networks.
