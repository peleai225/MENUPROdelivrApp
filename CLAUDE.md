# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run with **pnpm** (npm/yarn are blocked by the preinstall hook).

```bash
# Install dependencies
pnpm install

# Type-check everything (libs first, then artifacts)
pnpm typecheck

# Type-check only shared libs
pnpm typecheck:libs

# Type-check a specific artifact
cd artifacts/mobile && pnpm typecheck
cd artifacts/api-server && pnpm typecheck

# Start the mobile app (Expo dev server — designed for Replit)
cd artifacts/mobile && pnpm dev

# Start the API server
cd artifacts/api-server && pnpm dev

# Start the mockup sandbox (Vite)
cd artifacts/mockup-sandbox && pnpm dev

# Build mobile (generates a static web bundle for Replit serving)
cd artifacts/mobile && pnpm build

# Build API server (esbuild → dist/index.mjs)
cd artifacts/api-server && pnpm build
```

There is no test suite yet.

## Architecture

### Monorepo layout

```
artifacts/
  mobile/       ← React Native / Expo 54 client app
  api-server/   ← Express 5 + TypeScript backend (skeleton)
  mockup-sandbox/ ← Vite + React + shadcn/ui for UI mockups
lib/
  api-spec/     ← OpenAPI YAML (source of truth for the API contract)
  api-client-react/ ← Orval-generated React/fetch client (lib/api-client-react/src/generated/)
  api-zod/      ← Orval-generated Zod schemas
  db/           ← Drizzle ORM config + schema (PostgreSQL, currently empty)
scripts/        ← Post-merge / CI helpers
```

### Mobile app (`artifacts/mobile`)

**Navigation** — Expo Router (file-system based). Entry in `app/_layout.tsx`. Tab bar lives in `app/(tabs)/_layout.tsx` (4 tabs: Accueil, Explorer, Panier, Profil). Modal screens: `login`, `register`. Stack screens: `restaurant/[id]/index`, `restaurant/[id]/menu`, `checkout`, `track/[token]`, `orders`, `addresses`.

**API client** — `lib/api.ts` is an Axios instance pointing at `https://menupro.ci/api/v1`. Auth token stored in AsyncStorage under `menupro_token`. A Bearer token is injected by the request interceptor. A 401 response clears the local session via a callback registered by `AuthProvider`.

**State management** — two Zustand stores:
- `context/CartContext.tsx` — persisted to AsyncStorage (`menupro-cart`). One cart per restaurant; switching restaurants prompts a confirmation alert via `addToCartWithConfirm()`.
- `lib/checkoutStore.ts` — ephemeral (in-memory only). Bridges the cart → checkout → tracking flow with the selected address and delivery estimate.

**Contexts** (all in `context/`):
- `AuthContext` — login/register/logout/updateProfile, persists token in AsyncStorage.
- `LocationContext` — requests GPS permission, falls back silently to Abidjan (`5.3542, -3.9827`).
- `ToastContext` — lightweight in-app toast system.

**Design system** — color tokens in `constants/colors.ts`, consumed via `useColors()` hook which reads `useColorScheme()`. Light palette only (dark key not defined). Primary brand color is `#f97316` (orange). All prices are in XOF centimes — always pass through `formatPrice()` from `lib/format.ts` before display.

**Live order tracking** — `app/track/[token].tsx` polls `/client/orders/track/:token` every 5 seconds with React Query. Push notifications are simulated locally: on each poll, if `order_status` changed, a local notification is fired via `lib/notifications.ts`.

**Web preview caveat** — `react-native-maps` breaks the web bundler; `TrackingMap.web.tsx` provides a web-safe fallback component. External API calls will fail in Replit web preview due to CORS.

### API server (`artifacts/api-server`)

Express 5 with pino logging. All routes mounted under `/api`. Currently only exposes `GET /api/healthz`. The real production API (`menupro.ci`) is external and not implemented here — this server is a scaffold waiting to be built out.

### Shared libs

The OpenAPI spec (`lib/api-spec/openapi.yaml`) currently only documents `/healthz`. When the API is expanded, run Orval to regenerate `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`.

The Drizzle schema (`lib/db/src/schema/index.ts`) is empty. Tables should be added there and exported; `drizzle.config.ts` points to a PostgreSQL `DATABASE_URL` env var.

### Key conventions

- All user-facing strings are in **French**.
- Phone numbers use Côte d'Ivoire prefixes — validated with `isPhoneCI()` in `lib/format.ts`.
- Payment method is Wave mobile money only (`payment_method: 'wave'`).
- Path aliases: `@/` maps to `artifacts/mobile/` in tsconfig.
