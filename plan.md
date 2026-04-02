# AwardX — System Design & MVP Roadmap

## Vision
An awards/competition management platform that matches or exceeds Zelous in UX, performance, security, and features.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (build, not CDN)
- **Backend**: Vercel Serverless Functions (`/api/`)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth — email/password, magic link, Google OAuth
- **Email**: Resend
- **Payments**: Stripe Connect (Phase 3)
- **Deployment**: Vercel

## Architecture

```
Browser
  └─ React SPA (Vite build, code-split by route)
       ├─ Marketing routes  →  Static pages (LCP <1.5s)
       ├─ /dashboard/*      →  Protected, lazy-loaded dashboard
       ├─ /program/:slug    →  Public program landing page
       ├─ /form/:formId     →  Authenticated submission form
       └─ /judge/:token     →  Tokenized judge portal

Vercel Edge
  ├─ /api/invites/*         →  Email sending (Resend)
  ├─ /api/payments/*        →  Stripe Checkout sessions
  ├─ /api/webhooks/stripe   →  Payment confirmation
  ├─ /api/ai/*              →  Gemini scoring suggestions
  └─ /api/admin/*           →  Service-role DB operations

Supabase (PostgreSQL)
  ├─ Auth  (JWT, RLS enforcement)
  ├─ DB    (33 tables, RLS on all org-scoped tables)
  ├─ Storage (submission files, avatars)
  └─ Realtime (submissions, scores, notifications)
```

## Phase 1 — Foundation (Weeks 1–4)
Fix the critical gaps before any public traffic.

| Task | Why |
|------|-----|
| React Router v6 | URL params routing breaks on hard refresh |
| Row Level Security | Zero RLS = any user can read any org's data |
| Tailwind build (not CDN) | CDN adds ~350KB render-blocking JS |
| React.lazy code splitting | All 30+ components eagerly loaded → slow initial load |
| Auth Context | Module-level caching causes stale data bugs |
| Self-host fonts | Removes render-blocking Google Fonts round-trips |
| Rotate exposed credentials | Live keys in SETUP.md |
| API input validation (zod) | No sanitization = XSS/injection risk |
| Vercel function rate limiting | No protection on invite endpoints |

**Performance target after Phase 1**: LCP <1.5s desktop, <3s mobile

## Phase 2 — Core Features (Weeks 5–10)
Make every existing feature work end-to-end reliably.

- Error boundaries on every dashboard view
- Skeleton loading states + empty states
- Wire realtime subscriptions (SubmissionTable, JudgingView, AuditLogs)
- Paginated queries (currently all queries fetch unlimited rows)
- Full-text search on submissions (PostgreSQL tsvector)
- CSV export completion
- In-app notification system (bell icon already in UI)
- React Query for all data fetching
- Mobile-responsive dashboard & judge portal

## Phase 3 — Growth / Zelous Parity (Weeks 11–18)
Match and exceed the competition.

- **Stripe payments** — per-submission fees via Stripe Connect
- **White-labeling** — custom domains + brand settings per org
- **AI scoring assistance** — Gemini-powered score suggestions for judges
- **Applicant portal** — `/my-submissions` for submitters to track status
- **Automation rules** — "when X happens, do Y" event-driven actions
- **Advanced analytics** — materialized views, funnel, year-over-year

## Phase 4 — Scale (Weeks 19–26)
Production-grade infrastructure and observability.

- React Query caching + Vercel Edge Config for program slug lookups
- Vercel KV (Redis) for rate limiting + domain routing cache
- Sentry error tracking
- Vercel Analytics + Web Vitals
- Database indexes (submissions, org_members, audit_logs)
- Playwright E2E tests + GitHub Actions CI
- Connection pooling via Supabase PgBouncer pooler URL

## Competitive Differentiation vs Zelous

| Feature | Status |
|---------|--------|
| Multi-stage workflow editor | ✅ Built |
| Tokenized judge portal | ✅ Built |
| Custom public program pages | ✅ Built |
| Drag-drop form builder | ✅ Built |
| Stripe payments | 🔲 Phase 3 |
| Custom domains / white-label | 🔲 Phase 3 |
| AI scoring assistance | 🔲 Phase 3 (differentiator) |
| Applicant portal | 🔲 Phase 3 |
| Automation rules | 🔲 Phase 3 (differentiator) |
| Advanced analytics | 🔲 Phase 3 |
| Mobile app | 🔲 Phase 4 |

## Performance Targets

| Metric | Current (est.) | Target |
|--------|----------------|--------|
| LCP desktop (fast 4G) | ~3–4s | <1.5s |
| LCP mobile (3G) | ~6–8s | <3s |
| Initial JS bundle | ~800KB | <150KB |
| CSS payload | ~350KB | <25KB |
| Submissions list API | unbounded | <200ms (paginated) |

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Route declarations (replace with React Router) |
| `index.tsx` | App entry — BrowserRouter, CSS, providers |
| `index.html` | Remove Tailwind CDN + Google Fonts |
| `vercel.json` | Add catch-all rewrite |
| `services/supabase.ts` | Central data layer — align with RLS, pagination, realtime |
| `supabase/migrations/001_rls_policies.sql` | All RLS policies (new file) |
| `contexts/AuthContext.tsx` | Auth state provider (new file) |
| `contexts/ProgramContext.tsx` | Active program state (new file) |
| `components/ProtectedRoute.tsx` | Auth guard for dashboard routes (new file) |
| `tailwind.config.js` | Build-time Tailwind config (new file) |