# AwardX Bug Report

Generated: 2026-05-24

## Critical

### BUG-001 — macOS port 5000 hijacked by AirPlay (403 / proxy errors)
- **Symptom:** `403 Forbidden` on `/api/*`, Vite `http proxy error: socket hang up` / `ECONNRESET`
- **Cause:** Vite proxied `/api` to `localhost:5000`, but macOS AirPlay Receiver uses that port (`Server: AirTunes`)
- **Status:** Fixed — backend default `5001`, Vite proxy `5001`, docs updated

### BUG-002 — `npm run dev` starts frontend only
- **Symptom:** All `/api/*` calls fail when only Vite is running
- **Cause:** `dev` script ran Vite alone; Express server required for overview, media, leaderboard, etc.
- **Status:** Fixed — `npm run dev:all` runs client + server (no Vercel dev)

## High

### BUG-003 — Port mismatch in `server/.env.example` vs runtime
- **Symptom:** Server on 5000, Vite proxy on 5001 → broken API
- **Cause:** `.env.example` had `PORT=5000` while code defaulted to `5001`
- **Status:** Fixed — `PORT=5001` in `server/.env.example`

### BUG-004 — Media API IDOR (any authenticated user)
- **Symptom:** Any logged-in user could list another program's storage media
- **Cause:** `GET /api/overview/:programId/media` only used `requireAuth`, no program membership check
- **Status:** Fixed — `requireProgramAccess` middleware

### BUG-005 — Overview API only on Express (not Vercel `api/`)
- **Symptom:** Production deploy via Vercel static + serverless may miss overview routes
- **Cause:** Routes live in `server/` only; no `api/overview/*` handlers
- **Status:** Documented — deploy Express separately or set `VITE_BACKEND_URL` to Express host

## Medium

### BUG-006 — `VITE_BACKEND_URL` breaks when Vite uses non-3000 port
- **Symptom:** API calls hit wrong origin if port 3000 is taken (Vite uses 3001)
- **Cause:** `.env.example` hardcoded `http://localhost:3000`
- **Status:** Fixed — docs recommend leaving unset in dev; shared `fetchBackendJson` fallback

### BUG-007 — Inconsistent backend fetch (no relative fallback)
- **Symptom:** Mass email / leaderboard fail while overview works
- **Cause:** `MassEmailView`, `LeaderboardView` used absolute `VITE_BACKEND_URL` only
- **Status:** Fixed — `services/backendApi.ts` shared helper

### BUG-008 — Public overview Redis cache not invalidated on publish
- **Symptom:** Public page stale up to 5 minutes after publish (when Redis enabled)
- **Cause:** Cache keys `public:overview:*` not cleared; PageBuilder saves via Supabase, not Express
- **Status:** Fixed — broader invalidation + `POST /api/overview/:programId/invalidate-cache` from PageBuilder

### BUG-009 — Config DB errors returned as 404 on public routes
- **Symptom:** Real DB failures looked like "page not published"
- **Cause:** `program_page_configs` errors ignored in `getOverviewPayload`
- **Status:** Fixed — throw on `configResult.error`

### BUG-010 — PageBuilder media load race (silent 401)
- **Symptom:** Media picker empty with no error
- **Cause:** `getProgramMediaAssets` ran before auth session ready; errors swallowed
- **Status:** Fixed — wait for `useAuth`; require token in `overviewApi`

### BUG-011 — `VITE_BACKEND_PROXY_TARGET` undocumented
- **Status:** Fixed — added to `.env.example` and SETUP.md

## Low / Documentation

### BUG-012 — `server/README.md` outdated (port, routes, rate limit)
- **Status:** Fixed

### BUG-013 — `SETUP.md` missing full-stack dev instructions
- **Status:** Fixed

### BUG-014 — Duplicate "Next Steps" item 5 in SETUP.md
- **Status:** Fixed

### BUG-015 — Express overview write routes unused by PageBuilder (architectural drift)
- **Status:** Documented — editor uses Supabase directly; invalidation endpoint bridges cache gap

## Verification

```bash
npm run typecheck   # should pass
npm test            # unit tests
npm run dev:all     # starts client + server
curl http://localhost:5001/api/health
curl http://localhost:3000/api/overview/public/by-slug/Beautiful-Hearts
```

---

## Vercel Hobby plan (fixed)

### BUG-016 — Too many serverless functions (>12)
- **Status:** Fixed — all routes consolidated into `api/[...path].ts` (1 function)
- Handler code lives under `api/_handlers/` (not deployed as separate functions)

### BUG-017 — `z.record(z.any())` Zod 4 type error
- **Status:** Fixed — `z.record(z.string(), z.any())` in `api/_utils/validation.ts`

### BUG-018 — MUI date pickers
- **Status:** Fixed — `@mui/x-date-pickers` + `AppDatePicker` / `AppDateTimePicker` app-wide
