# School Bus Driver App

Premium map-first Expo app for driver MVP flow.

## Included
- Full-screen map with route polyline and next-stop highlight
- Draggable bottom sheet for student actions
- Status badges (IN/OUT), large touch targets, haptic action helper
- OTP login bootstrap + trip start + 5-second GPS send loop
- Attendance API actions (pickup/drop) with retry and queue

## Run
```bash
cp .env.example .env
npm install
npm start
```

## Realtime Smoke Flow (Driver)
1. Ensure backend is running and seeded (`npm run prisma:seed` in backend).
2. In `.env`, set:
   - `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:3000`
   - `EXPO_PUBLIC_DRIVER_PHONE=+10000000003`
   - `EXPO_PUBLIC_DRIVER_OTP_CODE=123456` (matches backend `OTP_DEV_CODE`)
   - `EXPO_PUBLIC_STUDENT_ID=seed-student-demo`
3. Open app and keep map screen active.
4. Verify backend logs show:
   - `trip_start_*`
   - `location_receive`
   - `location_ingested`
   - `ws_emit event=bus:location`
5. Tap `Mark IN` / `Mark OUT` and confirm `attendance_*` logs.
