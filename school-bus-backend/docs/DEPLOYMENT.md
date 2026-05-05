# Deployment

## Prerequisites

- Node.js 20+ or 22+
- PostgreSQL 14+
- Redis 6+
- Apache Kafka 3.x (optional for local dev: set `KAFKA_DISABLED=1`)

## Environment

Copy [.env.example](../.env.example) to `.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis URL (include password if required) |
| `KAFKA_BROKERS` | Comma-separated broker list (e.g. `kafka:9092`) |
| `KAFKA_DISABLED` | Set `1` to process tracking inline (no Kafka broker) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Min 32 characters each |
| `JWT_ACCESS_EXPIRES_SEC` / `JWT_REFRESH_EXPIRES_SEC` | Token TTL in seconds |
| `OTP_DEV_CODE` | Optional fixed OTP for staging only (never in production) |

## Local (Docker Compose)

```bash
docker compose up -d
cp .env.example .env
# Edit .env: DATABASE_URL, REDIS_URL, KAFKA_DISABLED=1 for laptop-only
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

- HTTP API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- WebSocket namespace: `/realtime` (auth: `socket.handshake.auth.token = <access JWT>`)

## E2E tests

With Postgres + Redis running and DB migrated + seeded:

```bash
export RUN_E2E=1
npm run test:e2e
```

## Railway / managed Kafka

Use the **internal** listener URL for `KAFKA_BROKERS` from your provider (e.g. `kafka.railway.internal:29092`). Ensure the app service can reach the broker on the private network.

Rotate any credentials that were pasted into chat; store secrets only in the platform env UI.

## Docker image

```bash
docker build -t school-bus-backend .
docker run --env-file .env -p 3000:3000 school-bus-backend
```

Apply migrations before or at container start (e.g. init job or `prisma migrate deploy` in entrypoint).

## Web clients (Socket.IO)

1. `POST /auth/request-otp` then `POST /auth/verify-otp` to obtain `accessToken`.
2. Connect to `/realtime` with `auth: { token: accessToken }`.
3. Emit `subscribe:bus` with `{ busId }` after connection (server validates parent/admin/driver access).
