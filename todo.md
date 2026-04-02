# AwardX — Development TODO

> Status: 🔲 Not started | 🔄 In progress | ✅ Done | ❌ Blocked

---

## Phase 1 — Foundation

### Routing
- ✅ Install react-router-dom v6
- ✅ Rewrite `App.tsx` with `<Routes>` replacing currentPage state machine
- ✅ Create `components/ProtectedRoute.tsx`
- ✅ Update `vercel.json` with catch-all rewrite
- ✅ Migrate `AuthCallback.tsx` to `useNavigate`
- ✅ Remove all `onNavigate` props from LoginPage, SignupPage, JudgePortalPage, FormSubmissionPage, PublicProgramPage

### Security (Critical — must ship before public traffic)
- ✅ Create `supabase/migrations/001_rls_policies.sql` with policies for ALL org-scoped tables
- ✅ Enable RLS: `programs`, `categories`, `submissions`, `judges`, `scores`, `judging_criteria`
- ✅ Enable RLS: `organization_members`, `organization_invites`, `roles`, `role_permissions`
- ✅ Enable RLS: `rounds`, `program_forms`, `program_form_fields`, `audit_logs`
- ✅ Add public read policy for Active/Public programs
- ✅ Add judge token access policy on submissions
- ✅ Append-only policy on `audit_logs`
- 🔲 Rotate Supabase credentials (URL + anon key referenced in SETUP.md)
- ✅ Remove live credentials from SETUP.md
- ✅ Add zod validation to all `/api/` Vercel functions
- ✅ Add rate limiting to invite endpoints (10 req / 15 min / IP)
- ✅ Move service-role operations to server-only env vars (no `VITE_` prefix)

### Performance
- ✅ Install `tailwindcss` + `postcss` + `autoprefixer`
- ✅ Create `tailwind.config.js` (extract theme from `index.html` inline script)
- ✅ Create `src/index.css` with `@tailwind` directives; import in `index.tsx`
- ✅ Remove Tailwind CDN `<script>` from `index.html`
- ✅ Wrap all page routes in `React.lazy` + `<Suspense>`
- ✅ Lazy-load React Flow (only loads on workflow page)
- 🔲 Lazy-load Recharts (only loads on analytics view)
- ✅ Replace Google Fonts `<link>` with `@fontsource/inter` + `@fontsource/outfit`

### State Management
- ✅ Create `contexts/AuthContext.tsx` (user, session, org, permissions)
- ✅ Create `contexts/ProgramContext.tsx` (activeProgram)
- ✅ Remove module-level `cachedUserId` / `cachedOrgId` from `services/supabase.ts`
- ✅ Remove duplicated `onAuthStateChange` calls across components

---

## Phase 2 — Core Features

### Reliability
- ✅ Create `components/ErrorBoundary.tsx`
- ✅ Wrap all dashboard views in `ErrorBoundary`
- ✅ Create `components/SkeletonLoader.tsx`
- ✅ Add skeleton loading to `SubmissionTable`
- ✅ Add skeleton loading to `DashboardOverview` stat cards
- ✅ Add empty states: SubmissionTable, JudgingView, AnalyticsView, TeamsView

### Real-Time
- ✅ Wire realtime subscription in `SubmissionTable.tsx`
- ✅ Wire realtime subscription in `JudgingView.tsx` (live judge score progress)
- ✅ Wire realtime subscription in `AuditLogsView.tsx`
- ✅ Add `REPLICA IDENTITY FULL` migration for realtime tables

### Data / Queries
- ✅ Install `@tanstack/react-query`
- 🔄 Migrate all `useEffect + setState` data fetching to `useQuery`
- ✅ Add pagination to `submissions.getAll()` (`.range()` + `count: exact`)
- ✅ Add pagination UI to `SubmissionTable` (Load More / page numbers)
- ✅ Add pagination to judges list, audit logs, contacts
- ✅ Add `tsvector` search column + GIN index to `submissions`
- ✅ Add debounced search input to `SubmissionTable`
- ✅ Complete CSV export handler in `SubmissionTable`

### Notifications
- ✅ Create `notifications` table migration
- ✅ Create Vercel function: notify on new submission
- ✅ Create Vercel function: notify on judge assigned
- ✅ Create Vercel function: notify on deadline approaching
- ✅ Wire notification bell in `DashboardLayout` to realtime + unread count badge

### Mobile
- ✅ `DashboardLayout` sidebar → hamburger drawer on mobile breakpoint
- ✅ `SubmissionTable` → card layout on mobile
- ✅ `FormBuilder` → arrow controls fallback on touch devices
- 🔲 `JudgePortalPage` → score entry fully tested on mobile

---

## Phase 3 — Growth Features

### Stripe Payments
- ✅ Install `stripe` npm package (server-side Vercel functions only)
- ✅ Create `/api/payments/create-checkout.ts`
- ✅ Create `/api/webhooks/stripe.ts` (verify signature, mark submission paid)
- ✅ Update `FormSubmissionPage` to redirect to Checkout if `payment_config.enabled`
- ✅ Add Billing tab to `SettingsView` with Stripe Connect OAuth
- ✅ Add payment configuration section to `ProgramDetailsView`
- ✅ Add Razorpay option (order + verify flow) for regions where Stripe is limited
- ✅ Implement Stripe Connect status reconciliation endpoint and webhook sync

### White-Labeling
- 🔲 Add `custom_domain` + `brand_settings` (jsonb) columns to `organizations`
- 🔲 Create Vercel Edge Middleware (`middleware.ts`) for domain routing
- 🔲 Set up Vercel KV for domain→org_id cache
- 🔲 Update `PublicProgramPage` to apply org branding
- 🔲 Update `FormSubmissionPage` to apply org branding
- 🔲 Update email templates to use org's configured sender name/address

### AI Scoring Assistance
- 🔲 Create `/api/ai/score-suggestion.ts` (Gemini API, server-side only — no key in browser)
- 🔲 Add "Get AI Suggestion" button to `JudgingView`
- 🔲 Add "Get AI Suggestion" button to `JudgePortalPage`
- 🔲 Log AI suggestions separately from human scores in DB

### Applicant Portal
- ✅ Create `/my-submissions` route + page component
- ✅ Show submission status, judge feedback, draft editing
- ✅ Withdrawal functionality

### Automation Rules
- 🔲 Create `automation_rules` table migration
- 🔲 Create rule evaluation Supabase Edge Function
- 🔲 Add Automations tab to dashboard
- 🔲 Implement rule: status change → send email
- 🔲 Implement rule: round start → notify judges

### Advanced Analytics
- 🔲 Create `submission_daily_counts` materialized view + pg_cron refresh
- 🔲 Add funnel analytics (viewed → started → submitted)
- 🔲 Add judge performance metrics
- 🔲 Add year-over-year comparison view
- 🔲 Add analytics CSV export

---

## Phase 4 — Scale

### Caching & Infrastructure
- 🔲 Set up Vercel Edge Config for program slug → id lookups
- 🔲 Set up Vercel KV for rate limit counters + domain routing
- 🔲 Switch Supabase connection to PgBouncer pooler URL in Vercel functions

### Observability
- ✅ Install + configure Sentry (`VITE_SENTRY_DSN`)
- ✅ Set up Vercel Analytics
- 🔄 Add structured logging to all Vercel functions
- ✅ Set up uptime monitoring for `/api/health`, `/program/:slug`, `/judge/:token`

### Database Optimization
- ✅ Add index: `submissions(program_id, status)`
- ✅ Add index: `submissions(created_at DESC)`
- ✅ Add index: `submission_judges(judge_id)`
- ✅ Add index: `submission_judges(submission_id)`
- ✅ Add index: `organization_members(user_id, organization_id)`
- ✅ Add index: `audit_logs(organization_id, created_at DESC)`
- 🔲 Run EXPLAIN ANALYZE on top 10 slowest queries

### Testing & CI
- ✅ Install `vitest` + `@testing-library/react`
- 🔄 Write unit tests for `services/supabase.ts` critical functions
- ✅ Install Playwright
- 🔄 Write E2E: signup → create program → submit → judge → export results
- ✅ Create `.github/workflows/ci.yml` (typecheck → vitest → build → Playwright)
