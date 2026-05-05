# School Bus Parent App

Premium tracking Expo app for parent MVP flow.

## Included
- Full-screen bus map view
- ETA/status bottom card
- Pickup/drop timeline
- OTP login bootstrap + websocket subscription to bus channel
- Fallback polling (`GET /parent/bus/live`) when WS disconnects

## Run
```bash
cp .env.example .env
npm install
npm start
```

## Realtime Smoke Flow (Parent)
1. Configure `.env`:
   - `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:3000`
   - `EXPO_PUBLIC_PARENT_PHONE=+10000000004`
   - `EXPO_PUBLIC_PARENT_OTP_CODE=123456`
   - `EXPO_PUBLIC_BUS_ID=<busId from /driver/trips/start response>`
2. Start app while Driver app is sending locations.
3. Confirm status card mode becomes `WS_CONNECTED`.
4. Verify marker moves and timeline/status updates after attendance actions.
5. Disable network briefly; confirm mode switches to polling and map still refreshes.
