# School Bus Admin Dashboard

Production-grade SaaS admin dashboard integrated with backend OTP auth, tenant-aware APIs, CRUD workflows, and realtime fleet tracking.

## Features
- OTP auth session (`/auth/request-otp`, `/auth/verify-otp`, `/auth/refresh`)
- Role-aware admin flows (`SUPER_ADMIN`, `SCHOOL_ADMIN`)
- Tenant switch input (super admin only, sent as `X-Tenant-Id`)
- Dashboard KPIs + recent activity
- Students CRUD (search, pagination, soft delete)
- Drivers CRUD (search, pagination, soft delete)
- Buses CRUD + driver/student assignment actions
- Live map realtime panel (`bus:location`, `attendance:update`) with polling fallback
- Dark/light mode support

## Default Super Admin (seeded)
- phone: `9880020224`
- OTP login flow still applies (password hash is seeded for compliance/back-office checks)

## Run
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Required env
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_TENANT_ID` (for super admin tenant scope)

## Realtime flow
1. Login as admin via OTP.
2. Open `/live-map`.
3. Start driver trip and location stream from mobile app.
4. Verify bus cards update live, fallback polling when socket disconnects.
