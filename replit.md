# MenuPro Delivery

Native mobile food-ordering & delivery app for Côte d'Ivoire (Expo/React Native), backed by the live external MenuPro API at `https://menupro.ci/api/v1`.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo dev server (workflow: `artifacts/mobile: expo`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000) — unrelated to MenuPro, scaffold default, unused by this app
- `pnpm run typecheck` — full typecheck across all packages
- No local backend for MenuPro — the mobile app talks directly to the external production API; no `DATABASE_URL` or codegen needed for this feature.

## Stack

- Expo Router (file-based routing), TypeScript
- React Query for all server data; axios client (`artifacts/mobile/lib/api.ts`) with Bearer-token interceptor
- zustand (+ persist/AsyncStorage) for cart state; AsyncStorage for auth token/customer
- react-hook-form + zod for Login/Register validation
- react-native-maps (pinned 1.18.0) for the order-tracking map, native-only (see Gotchas)

## Where things live

- `artifacts/mobile/lib/endpoints.ts` — all typed calls to the external MenuPro API
- `artifacts/mobile/lib/format.ts` — price (centimes→FCFA), distance, date formatting, CI phone validation
- `artifacts/mobile/context/` — Auth, Cart, Location, Toast providers
- `artifacts/mobile/app/` — screens: tabs (Home/Explore/Cart/Profile), restaurant detail+menu, checkout, order tracking, order history, addresses, login/register

## Architecture decisions

- Live order tracking uses polling (`refetchInterval` ~5s on `GET /client/orders/track/{token}`) instead of WebSocket/Laravel Echo — a deliberate simplification from the original spec.
- Payment is Wave-only: `createOrder` → `initiatePayment` → open `payment_url` in an in-app browser (`expo-web-browser`) → redirect to tracking screen.
- No backend of our own for this feature — all data comes directly from the external production API; this app is a pure client.

## Product

Browse nearby restaurants, view menus, build a cart (locked to one restaurant at a time), check out with a delivery address and Wave payment, and track the order live (polled) with driver info, ETA, and a status timeline. Includes auth (phone+password), saved addresses, and order history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `react-native-maps` has no web build support (imports RN internals that break Metro's web bundler). Any map UI must live behind a platform split: `components/TrackingMap.tsx` (native) + `components/TrackingMap.web.tsx` (placeholder) — never import `react-native-maps` directly in a screen file.
- The external MenuPro API has no CORS headers, so the **web preview** (used for screenshots) will show CORS errors and never load data — this is expected and only affects browser-based preview; the real Expo Go / native app is unaffected since CORS is a browser-only restriction.
- `GET /restaurants` and `GET /restaurants/{id}` do **not** return `delivery_fee` — only `GET /restaurants/nearby` and `GET /restaurants/{id}/delivery-estimate` do. Always treat `delivery_fee`/`distance_km` on the `Restaurant` type as optional and hide the UI stat when absent.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
