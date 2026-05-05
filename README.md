# School bus tracking

Monorepo-style workspace for the **School Transport Tracking** platform.

## Backend (Phase 1)

See [school-bus-backend/README.md](school-bus-backend/README.md) for NestJS + Prisma + Redis + Kafka + Socket.IO setup, API overview, and deployment.

```bash
cd school-bus-backend
docker compose up -d
cp .env.example .env   # set secrets & KAFKA_DISABLED if needed
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

Mobile (Expo) and web (Next.js) apps are planned as **separate repositories** per architecture decision.
