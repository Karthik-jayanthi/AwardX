import React, { useEffect, useMemo, useRef, useState } from 'react';
import MiniSearch from 'minisearch';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Book,
  Settings,
  Database,
  Shield,
  Layers,
  Zap,
  Code2,
  GitBranch,
  Users,
  Mail,
  FileJson,
  ChevronRight,
  Hash,
  BookOpen,
  Workflow,
  Vote,
  ClipboardList,
  CreditCard,
  Trophy,
  LifeBuoy,
  Sparkles,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';

// ----- Docs content model -----
type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string; id?: string }
  | { kind: 'code'; lang?: string; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'callout'; tone: 'info' | 'warn' | 'success'; title: string; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

type DocSection = {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  blocks: DocBlock[];
};

const sections: DocSection[] = [
  {
    id: 'introduction',
    title: 'What is AwardX',
    category: 'Getting Started',
    icon: Book,
    description: 'A workspace for running awards programs end-to-end — entry, judging, voting, and announcement.',
    blocks: [
      {
        kind: 'p',
        text: 'AwardX is a multi-tenant awards management system. You create an organization, spin up one or more programs inside it, configure how submissions are collected and judged, then run the program from intake to winner announcement in the same dashboard.',
      },
      {
        kind: 'p',
        text: 'The platform is organised around five top-level resources: organizations, programs, categories, submissions, and rounds. Everything else — judges, forms, scores, payments, public voting — hangs off those.',
      },
      {
        kind: 'h3', text: 'What it covers' },
      {
        kind: 'list',
        items: [
          'Public landing pages and submission forms per program',
          'A drag-and-drop form builder with multi-step sections',
          'Multi-round judging with configurable evaluation logic',
          'Public voting rounds with leaderboards',
          'Paid entries via Stripe, Razorpay, or PayPal',
          'Mass email to judges, applicants, and team members',
          'Audit logs and granular role-based permissions',
        ],
      },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture overview',
    category: 'Getting Started',
    icon: Layers,
    description: 'How the frontend, API server, scheduler, and Supabase backend fit together.',
    blocks: [
      { kind: 'p', text: 'AwardX is a single TypeScript repository. The browser app, the Node API, and the serverless route handlers all live alongside each other, and Supabase provides Postgres, auth, storage, and realtime.' },
      { kind: 'h3', text: 'Top-level layout' },
      {
        kind: 'table',
        headers: ['Folder', 'Role', 'Stack'],
        rows: [
          ['/ (root) + components/ + src/', 'Dashboard SPA and marketing pages', 'Vite 6, React 19, Tailwind v4, Framer Motion, React Router 6'],
          ['server/', 'Long-running API server', 'Node + Express 4, tsx in dev'],
          ['api/', 'Serverless route handlers (Vercel)', 'TypeScript Node functions'],
          ['supabase/migrations/', 'Versioned SQL migrations', 'Plain PostgreSQL (RLS-aware)'],
          ['services/', 'Frontend data layer', 'Supabase JS client, TanStack Query'],
          ['types/ + lib/ + hooks/', 'Shared types and helpers', 'TypeScript'],
        ],
      },
      { kind: 'h3', text: 'Request lifecycle' },
      {
        kind: 'list',
        items: [
          'The browser loads the Vite-built React app and authenticates against Supabase Auth.',
          'Reads usually hit Supabase directly through the JS client; Row Level Security in Postgres enforces who can see what.',
          'Mutations that touch multiple tables, run authorization beyond RLS, or wrap business logic (advancement, voting, judge assignment) go through the Express server in /server.',
          'A scheduler started at server boot (server/src/jobs/roundScheduler.ts) drives round-state transitions on a timer.',
          'Outbound email goes through Resend via either an org-level or program-level connection.',
        ],
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Run AwardX locally',
    category: 'Getting Started',
    icon: Zap,
    description: 'Clone, install, point at Supabase, and run the app + API together.',
    blocks: [
      { kind: 'p', text: 'You need Node 20+, npm, and a Supabase project (cloud or local). The frontend uses the Supabase anon key; the API server uses the service-role key.' },
      {
        kind: 'code',
        lang: 'bash',
        text: `# 1. Install dependencies
npm install

# 2. Set up env vars at the repo root
cp env/.env.example .env  # then fill the values below

# 3. Apply the migrations against your Supabase Postgres
#    Run supabase/migrations/*.sql in order, or use the Supabase CLI:
supabase db push

# 4. Start the dev servers
npm run dev          # Vite frontend (http://localhost:5173)
npm --prefix server run dev  # Express API (http://localhost:5001)`,
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Two servers, one app',
        text: 'The Vite dev server serves the UI; the Express server in /server handles the writes that need elevated privileges. Both must be running for the dashboard to function.',
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Environment variables',
    category: 'Setup',
    icon: Settings,
    description: 'The variables the frontend and API server read on boot.',
    blocks: [
      { kind: 'p', text: 'Vite-exposed variables must be prefixed with VITE_. Anything else is read only by the Express server in /server. The API server reads .env first and then .env.local as an override, matching Vite\'s convention.' },
      { kind: 'h3', text: 'Frontend (Vite)' },
      {
        kind: 'table',
        headers: ['Variable', 'Required', 'Purpose'],
        rows: [
          ['VITE_SUPABASE_URL', 'Yes', 'Your Supabase project URL'],
          ['VITE_SUPABASE_ANON_KEY', 'Yes', 'Public anon key for the browser client'],
          ['VITE_API_BASE_URL', 'Optional', 'Base URL of the Express server (defaults to /api proxy in dev)'],
          ['VITE_SENTRY_DSN', 'Optional', 'Frontend error reporting'],
        ],
      },
      { kind: 'h3', text: 'API server (Node)' },
      {
        kind: 'table',
        headers: ['Variable', 'Required', 'Purpose'],
        rows: [
          ['SUPABASE_URL', 'Yes', 'Same project URL'],
          ['SUPABASE_SERVICE_ROLE_KEY', 'Yes', 'Service-role key used for privileged writes'],
          ['REDIS_URL', 'Optional', 'Enables the Redis cache layer; falls back to in-memory when absent'],
          ['RESEND_API_KEY', 'Recommended', 'Default Resend key for organization-level email'],
          ['PORT', 'Optional', 'API port — defaults to 5001 to avoid macOS AirPlay on 5000'],
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: 'Service-role key is server-only',
        text: 'Never expose SUPABASE_SERVICE_ROLE_KEY to the browser. It bypasses RLS. Only the Express server should hold it.',
      },
    ],
  },
  {
    id: 'database',
    title: 'Database & migrations',
    category: 'Setup',
    icon: Database,
    description: 'Plain SQL migrations against Supabase Postgres, with RLS as the primary authorization gate.',
    blocks: [
      { kind: 'p', text: 'AwardX uses raw SQL migration files committed to supabase/migrations/. There is no ORM — the frontend uses the Supabase JS client and the API server uses @supabase/supabase-js with the service-role key.' },
      { kind: 'h3', text: 'Migration workflow' },
      {
        kind: 'code',
        lang: 'bash',
        text: `# 1. Add a new file with a numeric prefix (existing range: 001 → 026)
#    supabase/migrations/027_my_change.sql
# 2. Write the change as plain SQL, including any new RLS policies
# 3. Apply with the Supabase CLI
supabase db push

# Generated TS types live in services/database.types.ts.
# Regenerate after schema changes:
npx supabase gen types typescript --project-id YOUR_PROJECT_ID \\
  > services/database.types.ts`,
      },
      { kind: 'h3', text: 'Core tables' },
      {
        kind: 'list',
        items: [
          'organizations — top-level tenant; users belong via org_members',
          'programs — an awards program inside an organization',
          'program_categories — categories and subcategories for entries',
          'program_forms — form schemas; one is marked active per program',
          'submissions — entries and their judging state',
          'rounds + round_edges — the judging workflow graph',
          'judges, judge_groups, judge_category_assignments — the panel',
          'scores — per-judge, per-submission, per-criterion',
          'program_payment_configs — Stripe/Razorpay/PayPal settings',
          'invites + email_logs — outbound invite delivery',
          'audit_logs — append-only record of sensitive actions',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'RLS is enforced',
        text: 'Most tables ship with RLS policies (see migration 001_rls_policies.sql plus targeted hardening migrations). The frontend can talk to Supabase directly because RLS will refuse rows the user is not entitled to.',
      },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication & roles',
    category: 'Setup',
    icon: Shield,
    description: 'Supabase Auth for sign-in, custom role tables for what each user can do.',
    blocks: [
      { kind: 'p', text: 'Sign-in is handled entirely by Supabase Auth. AwardX supports email + password and OAuth providers (Google, GitHub, LinkedIn). The session JWT travels with every Supabase request and is forwarded to the Express API as a bearer token.' },
      { kind: 'h3', text: 'Built-in roles' },
      {
        kind: 'table',
        headers: ['Role', 'Scope', 'Typical permissions'],
        rows: [
          ['Owner', 'Organization', 'Billing, delete org, full access to every program'],
          ['Admin', 'Organization', 'Create programs, invite team, view analytics'],
          ['Program Manager', 'Single program', 'Manage one program — categories, forms, judges, exports'],
          ['Judge', 'Round', 'Score the submissions assigned to them'],
          ['Applicant', 'Submission', 'Submit and edit their own entries on the public side'],
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Permission checks happen in two places',
        text: 'The frontend gates UI with services/database.ts hasPermission(...) to hide things the current user cannot touch. The Express server re-checks every mutation in server/src/middleware (programAccess.ts, programManagement.ts) — never trust the client alone.',
      },
    ],
  },
  {
    id: 'programs',
    title: 'Organizations, programs & categories',
    category: 'Core Concepts',
    icon: Trophy,
    description: 'The hierarchy every other concept hangs off.',
    blocks: [
      { kind: 'p', text: 'An organization is the billing and team boundary. A program is a single awards cycle — for example "2026 Design Awards" — belonging to one organization. Categories live inside a program and can be nested.' },
      { kind: 'h3', text: 'Lifecycle of a program' },
      {
        kind: 'list',
        items: [
          'Create the program shell and set basic details (deadline, branding, visibility).',
          'Build the entry form in the Form Builder; activate it for the program.',
          'Add categories (and subcategories if needed).',
          'Configure the schedule and rounds — what happens after entries close.',
          'Invite judges and assign them to categories or specific submissions.',
          'Open the program to receive submissions through the public landing page.',
          'Advance shortlists between rounds; announce winners on the leaderboard.',
        ],
      },
    ],
  },
  {
    id: 'forms',
    title: 'Form builder & submissions',
    category: 'Core Concepts',
    icon: FileJson,
    description: 'Build the entry form once; it renders identically on the admin preview and the public submission page.',
    blocks: [
      { kind: 'p', text: 'The Form Builder produces a JSON schema describing fields, sections, and validation. A program can have multiple forms in draft, but only the one marked active is exposed to applicants.' },
      { kind: 'h3', text: 'Supported field types' },
      {
        kind: 'list',
        items: [
          'Text, long text, number, date, dropdown, multi-select, URL',
          'File upload with per-field size and MIME constraints',
          'Image attachments rendered as a gallery',
          'Multi-step sections — split a long form across pages',
          'Conditional logic — show or hide fields based on prior answers',
          'Category selector — bound to the program’s categories list',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Public submission page',
        text: 'Each program with an active form gets a public URL (see PublicProgramPage and FormSubmissionPage in components/pages). Applicants can submit signed-in or via a shareable link, depending on the program’s visibility settings.',
      },
    ],
  },
  {
    id: 'judging',
    title: 'Judging & scoring',
    category: 'Core Concepts',
    icon: ClipboardList,
    description: 'Judge groups, criteria, blind evaluation, and scoring rollup.',
    blocks: [
      { kind: 'p', text: 'Judging is structured as rounds (see next section). Inside a round, each judge sees only the submissions they have been assigned, scores them against the configured criteria, and saves progress as they go.' },
      { kind: 'h3', text: 'Concepts' },
      {
        kind: 'list',
        items: [
          'Judge groups — collections of judges that can be assigned together.',
          'Category assignment — judges can be restricted to specific categories.',
          'Auto-assign — distribute submissions across the panel based on count and load.',
          'Blind evaluation — hide applicant identity from the judge interface.',
          'Per-criterion scores — judges score each criterion; weights produce the aggregate.',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Where it lives in the code',
        text: 'Judge UX is in components/dashboard/JudgingView.tsx, JudgeScoringModal.tsx, and the judgeGroups/ subfolder. The judge-facing portal is components/pages/JudgePortalPage.tsx.',
      },
    ],
  },
  {
    id: 'schedule-rounds',
    title: 'Schedule & rounds workflow',
    category: 'Core Concepts',
    icon: Workflow,
    description: 'Compose evaluation as a graph of rounds with explicit start/end conditions.',
    blocks: [
      { kind: 'p', text: 'A program’s evaluation can be a single round or a graph of rounds connected by edges. AwardX ships two equivalent editors: a tile view for linear flows and a React Flow graph view for branching workflows.' },
      { kind: 'h3', text: 'What a round configures' },
      {
        kind: 'list',
        items: [
          'Type — jury, public voting, shortlisting, nomination, announcement, or custom.',
          'Evaluator strategy — which judges or audience evaluates this round.',
          'Start condition — fixed datetime, after previous round, or manual trigger.',
          'End condition — fixed datetime, manual close, or auto-close when a count is hit.',
          'Shortlist — percentage or fixed count, with admin/judge/public visibility.',
          'Edges — outgoing connections and their condition (always, if shortlisted, score threshold, manual approval).',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Linear ↔ graph conversion is explicit',
        text: 'Switching between tile (linear) and workflow (graph) views asks for confirmation before destructive overwrites, so a hand-authored branching graph is never silently flattened.',
      },
    ],
  },
  {
    id: 'public-voting',
    title: 'Public voting rounds',
    category: 'Core Concepts',
    icon: Vote,
    description: 'Open a round to the public, collect votes, and surface a live leaderboard.',
    blocks: [
      { kind: 'p', text: 'Any round can be set to public voting. The program gets a shareable voting URL; visitors cast votes through PublicVotingPage with per-program rate-limiting and anti-abuse logic in the voting engine.' },
      {
        kind: 'list',
        items: [
          'Vote weight, per-IP limits, and identity requirements are configured on the round.',
          'Results stream into LeaderboardView in the dashboard and into the program’s public leaderboard.',
          'When the round ends, advancement uses the leaderboard cut-off rules to populate the next round.',
        ],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Paid entries',
    category: 'Core Concepts',
    icon: CreditCard,
    description: 'Stripe, Razorpay, and PayPal — pick a gateway per program.',
    blocks: [
      { kind: 'p', text: 'A program can require a payment before a submission is accepted. The provider is configured per program via program_payment_configs and the gateway is selected at runtime.' },
      {
        kind: 'list',
        items: [
          'Stripe — Checkout sessions for the broadest currency coverage.',
          'Razorpay — Indian market with UPI, cards, and netbanking.',
          'PayPal — classic Express Checkout flow.',
          'Per-category fees — different fees for different entry categories in the same program.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: 'Webhook security',
        text: 'Each gateway’s webhook handler lives in api/_handlers and verifies the provider’s signature before mutating state. Do not bypass these handlers when adding a new gateway.',
      },
    ],
  },
  {
    id: 'communications',
    title: 'Mass email & invites',
    category: 'Core Concepts',
    icon: Mail,
    description: 'Resend-backed transactional and bulk email to applicants, judges, and team members.',
    blocks: [
      { kind: 'p', text: 'AwardX uses Resend for outbound email. You can connect Resend at the organization level (covers every program) or per program (overrides the org connection for that program).' },
      {
        kind: 'list',
        items: [
          'Team invites — invite an organization member with a role.',
          'Judge invites — invite a judge to a specific program or panel.',
          'Mass email — target a saved audience (judges, applicants, shortlisted) with a templated message.',
          'Email logs — every delivery is recorded for audit and retries.',
        ],
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    category: 'Extending',
    icon: Mail,
    description: 'External services AwardX talks to today.',
    blocks: [
      {
        kind: 'list',
        items: [
          'Supabase — Postgres, auth, storage, realtime.',
          'Resend — transactional and bulk email.',
          'Stripe / Razorpay / PayPal — paid entries.',
          'Sentry — frontend error reporting.',
          'Redis (via ioredis) — optional server-side cache layer.',
          'Vercel Analytics — page-level usage on the public marketing surface.',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Connecting Resend',
        text: 'Open Settings → Integrations to attach a Resend API key at the organization level. Switch to a specific program to override it just for that program.',
      },
    ],
  },
  {
    id: 'api',
    title: 'API surface',
    category: 'Extending',
    icon: Code2,
    description: 'How the dashboard, the Express server, and the serverless handlers fit together.',
    blocks: [
      { kind: 'p', text: 'There are three pieces of API surface in the repo. Most of what you build on top of AwardX will hit one of them; pick based on whether the call is privileged, public, or bursty.' },
      {
        kind: 'table',
        headers: ['Surface', 'Where', 'When to use'],
        rows: [
          ['Express server', 'server/src/routes', 'Privileged mutations (advancement, judge assignment, schedule rounds, invites, mass email).'],
          ['Serverless handlers', 'api/_handlers', 'Per-request endpoints — payment webhooks, submissions, scores, notifications.'],
          ['Supabase JS client', 'services/database.ts', 'Direct reads (and writes the frontend is allowed to make under RLS).'],
        ],
      },
      { kind: 'h3', text: 'Example: list a program’s rounds' },
      {
        kind: 'code',
        lang: 'bash',
        text: `# Direct Supabase read (gated by RLS)
curl "$SUPABASE_URL/rest/v1/rounds?program_id=eq.PROGRAM_ID&select=*" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $USER_JWT"

# Express server — advance a round (requires program-manager auth)
curl -X POST "$API_BASE_URL/api/execution/rounds/ROUND_ID/advance" \\
  -H "Authorization: Bearer $USER_JWT" \\
  -H "Content-Type: application/json"`,
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deploying AwardX',
    category: 'Deployment',
    icon: Settings,
    description: 'How the repo is wired up for hosting today.',
    blocks: [
      { kind: 'p', text: 'The frontend builds to a static bundle with Vite; the api/ folder is a set of serverless route handlers (Vercel-flavored); the Express server in /server is a long-running Node process you host wherever you can run Node 20+.' },
      { kind: 'h3', text: 'What to deploy where' },
      {
        kind: 'list',
        items: [
          'Frontend — npm run build, then host the dist/ output on any static host (Vercel, Netlify, Cloudflare Pages).',
          'Serverless handlers — api/ is picked up automatically by Vercel; see vercel.json at the repo root.',
          'Express server — host on Fly.io, Render, Railway, a VPS, or any Node-friendly platform. It listens on PORT (default 5001).',
          'Database — a Supabase project. Apply supabase/migrations/*.sql in order on a fresh project.',
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Production checklist',
        text: 'Set every variable from the Environment section, point VITE_API_BASE_URL at the public Express URL, and double-check that RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY are present only on the server.',
      },
    ],
  },
  {
    id: 'testing',
    title: 'Testing',
    category: 'Community',
    icon: GitBranch,
    description: 'Vitest for unit and integration tests, Playwright for end-to-end.',
    blocks: [
      {
        kind: 'code',
        lang: 'bash',
        text: `# Unit + integration tests
npm test                         # vitest in watch mode (see vitest.config.ts)
npm run test -- --run            # one-shot run

# Targeted suites
npx vitest run tests/unit/scheduleRounds
npx vitest run tests/integration/scheduleRounds

# End-to-end
npx playwright test              # see playwright.config.ts`,
      },
      {
        kind: 'callout',
        tone: 'info',
        title: 'Where the tests live',
        text: 'tests/unit and tests/integration mirror the production folder layout. Schedule & rounds, advancement, and judge assignment have the deepest coverage; everything else has spot tests.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Getting help',
    category: 'Community',
    icon: LifeBuoy,
    description: 'Where to look when something is wrong.',
    blocks: [
      {
        kind: 'list',
        items: [
          'Check Sentry (if VITE_SENTRY_DSN is set) for the matching frontend error.',
          'Tail the Express server logs — most authorization failures are logged with the user and program IDs.',
          'Inspect Supabase logs for failed RLS checks; they look like permission denied with the table name.',
          'For mass email issues, the email_logs table records every send attempt and the Resend response.',
        ],
      },
    ],
  },
];

// ----- Page -----

type IndexedDoc = {
  id: string;
  title: string;
  category: string;
  description: string;
  body: string;
};

const buildIndex = (): { mini: MiniSearch<IndexedDoc>; map: Map<string, DocSection> } => {
  const mini = new MiniSearch<IndexedDoc>({
    fields: ['title', 'category', 'description', 'body'],
    storeFields: ['title', 'category', 'description'],
    searchOptions: { boost: { title: 3, category: 2 }, fuzzy: 0.2, prefix: true },
  });
  const map = new Map<string, DocSection>();
  const docs: IndexedDoc[] = sections.map((s) => {
    map.set(s.id, s);
    const body = s.blocks
      .map((b) => {
        if (b.kind === 'p' || b.kind === 'h3') return b.text;
        if (b.kind === 'code') return b.text;
        if (b.kind === 'list') return b.items.join(' ');
        if (b.kind === 'callout') return `${b.title} ${b.text}`;
        if (b.kind === 'table') return [...b.headers, ...b.rows.flat()].join(' ');
        return '';
      })
      .join(' ');
    return { id: s.id, title: s.title, category: s.category, description: s.description, body };
  });
  mini.addAll(docs);
  return { mini, map };
};

const categories = Array.from(new Set(sections.map((s) => s.category)));

const Block: React.FC<{ block: DocBlock }> = ({ block }) => {
  switch (block.kind) {
    case 'p':
      return <p className="text-slate-600 leading-relaxed mb-4">{block.text}</p>;
    case 'h3':
      return (
        <h3 className="text-xl font-bold text-slate-900 mt-10 mb-3 font-display flex items-center gap-2 group">
          <Hash className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          {block.text}
        </h3>
      );
    case 'code':
      return (
        <pre className="bg-slate-950 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm font-mono mb-6 border border-slate-800 shadow-lg">
          <code>{block.text}</code>
        </pre>
      );
    case 'list':
      return (
        <ul className="space-y-2 mb-6">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
              <ChevronRight className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const tones = {
        info: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        warn: 'bg-amber-50 border-amber-200 text-amber-900',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      } as const;
      return (
        <div className={`border rounded-xl p-5 mb-6 ${tones[block.tone]}`}>
          <div className="font-bold text-sm mb-1">{block.title}</div>
          <div className="text-sm leading-relaxed opacity-90">{block.text}</div>
        </div>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto mb-6 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-bold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-slate-100">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-600 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

export const DocsPage: React.FC = () => {
  const { mini, map } = useMemo(buildIndex, []);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const [showSearch, setShowSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasQuery = query.trim().length > 0;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return mini.search(query, { fuzzy: 0.2, prefix: true }).slice(0, 8);
  }, [query, mini]);

  // Items the keyboard cursor moves through: search results when querying,
  // popular pages when empty. Mirrors UniversalSearchPalette's flat list.
  const flatItems = useMemo(() => {
    if (hasQuery) return results.map((r) => map.get(r.id as string)!).filter(Boolean);
    return ['introduction', 'getting-started', 'schedule-rounds', 'judging']
      .map((id) => map.get(id))
      .filter((s): s is DocSection => Boolean(s));
  }, [hasQuery, results, map]);

  // Reset cursor whenever the visible set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query, showSearch]);

  // Keep the highlighted row in view as the user arrows through.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Cmd/Ctrl + K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 30);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll-spy: highlight sidebar entry of the section currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          setActiveId(top.target.id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jumpTo = (id: string) => {
    setShowSearch(false);
    setQuery('');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-28 pb-24">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-indigo-600 mb-4">
          <BookOpen className="w-4 h-4" /> AwardX Docs
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 font-display tracking-tight mb-4">
          Documentation
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          How AwardX is structured, how to run it locally, and how to extend it.
          Written against the current codebase — not a roadmap.
        </p>

        {/* Search trigger — matches the dashboard search bar */}
        <div className="mt-8 max-w-xl">
          <button
            type="button"
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => searchInputRef.current?.focus(), 30);
            }}
            aria-label="Search documentation"
            className="relative w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
            <div className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors flex items-center justify-between">
              <span>Search docs &mdash; try &ldquo;judging&rdquo; or &ldquo;rounds&rdquo;</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500">&#8984;K</kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Search palette — mirrors UniversalSearchPalette in the dashboard */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-[8px]"
              onClick={() => setShowSearch(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed inset-x-0 top-[12vh] z-[9999] mx-auto w-full max-w-2xl px-4"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = flatItems[activeIndex];
                  if (target) jumpTo(target.id);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowSearch(false);
                }
              }}
            >
              {/* Detached search input pill */}
              <div className="flex items-center gap-4 rounded-full border border-white/40 bg-white/75 backdrop-blur-xl px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-white/10 transition-all duration-300 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30">
                <Search className="h-5 w-5 shrink-0 text-indigo-500" />
                <input
                  ref={searchInputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the docs..."
                  className="flex-1 bg-transparent border-0 shadow-none outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none text-[17px] text-slate-900 placeholder:text-slate-400 font-medium"
                  style={{ border: 'none', background: 'transparent', boxShadow: 'none', outline: 'none' }}
                />
                <kbd className="hidden sm:inline-flex h-6 items-center rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-[9px] font-extrabold text-slate-400 tracking-widest">
                  ESC
                </kbd>
              </div>

              {/* Detached results panel */}
              <div className="mt-4 overflow-hidden rounded-[28px] border border-white/30 bg-white/75 backdrop-blur-xl shadow-[0_32px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-white/10">
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto overscroll-contain py-3 px-3 space-y-1">
                  {!hasQuery && (
                    <div className="px-5 py-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 shadow-inner">
                        <Sparkles className="h-6 w-6 text-indigo-500" />
                      </div>
                      <p className="text-base font-bold text-slate-800">Search the documentation</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Jump to any section — environment, judging, rounds, payments, deployment.
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100/50 pt-5 max-w-sm mx-auto">
                        <span className="flex items-center gap-1.5"><ArrowUp className="h-3.5 w-3.5" /><ArrowDown className="h-3.5 w-3.5" /> Navigate</span>
                        <span className="flex items-center gap-1.5"><CornerDownLeft className="h-3.5 w-3.5" /> Select</span>
                        <span className="flex items-center gap-1.5">ESC Close</span>
                      </div>
                    </div>
                  )}

                  {hasQuery && results.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50/40">
                        <Search className="h-7 w-7 text-slate-300" />
                      </div>
                      <p className="text-base font-bold text-slate-800">No results found</p>
                      <p className="mt-1 text-sm text-slate-500">We couldn&rsquo;t find anything matching &ldquo;{query}&rdquo;.</p>
                    </div>
                  )}

                  {flatItems.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-4 py-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          {hasQuery ? 'Results' : 'Popular pages'}
                        </span>
                      </div>
                      {flatItems.map((section, idx) => {
                        const Icon = section.icon;
                        const isActive = activeIndex === idx;
                        return (
                          <button
                            key={section.id}
                            data-index={idx}
                            type="button"
                            onClick={() => jumpTo(section.id)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`group flex w-full items-center gap-4 px-4 py-3 text-left rounded-2xl transition-all duration-200 ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.01]'
                                : 'text-slate-700 hover:bg-slate-50/50 hover:scale-[1.005]'
                            }`}
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-50/50 text-indigo-500 group-hover:bg-indigo-100/50'
                              } [&>svg]:h-5 [&>svg]:w-5`}
                            >
                              <Icon />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`truncate text-[15px] font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {section.title}
                              </div>
                              <div className={`mt-0.5 truncate text-[13px] ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {section.description}
                              </div>
                            </div>
                            {isActive && (
                              <CornerDownLeft className="h-4 w-4 shrink-0 text-white opacity-90" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {hasQuery && results.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-200/30 bg-slate-50/30 px-5 py-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {results.length} result{results.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><ArrowUp className="h-3.5 w-3.5" /><ArrowDown className="h-3.5 w-3.5" /> Navigate</span>
                      <span className="flex items-center gap-1.5"><CornerDownLeft className="h-3.5 w-3.5" /> Open</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Body grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-12">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <nav className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3 px-2">{cat}</div>
                <div className="space-y-0.5">
                  {sections.filter((s) => s.category === cat).map((s) => {
                    const Icon = s.icon;
                    const active = activeId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => jumpTo(s.id)}
                        className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-500 -ml-0.5 pl-3'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          </nav>
        </aside>

        {/* Content */}
        <article className="max-w-3xl">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-28 mb-20">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">
                  <Icon className="w-4 h-4" /> {s.category}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 font-display tracking-tight">{s.title}</h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed">{s.description}</p>
                <div className="prose-awardx">
                  {s.blocks.map((b, bi) => (
                    <Block key={bi} block={b} />
                  ))}
                </div>
                {i < sections.length - 1 && (
                  <div className="mt-16 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                )}
              </section>
            );
          })}

          <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden mt-12">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/30 blur-[100px] rounded-full" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3 font-display">Still stuck?</h3>
              <p className="text-slate-300 mb-6">
                Most issues line up with something concrete in the codebase. Check Sentry, the Express server logs, and Supabase RLS denials in that order &mdash; the section on Getting help walks through each.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => jumpTo('support')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  <LifeBuoy className="w-4 h-4" /> Read troubleshooting
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
