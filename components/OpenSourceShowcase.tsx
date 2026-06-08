import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Github,
  Layers,
  Database,
  Server,
  Workflow,
  ShieldCheck,
  Cog,
} from 'lucide-react';

// Numbers grounded in the actual repo at the time of writing:
//   supabase/migrations/   → 30 SQL migrations
//   server/src/routes/     → 19 Express routers
//   components/dashboard/  → 39 top-level dashboard views
const stats = [
  { icon: Database, label: 'SQL migrations', value: 30, suffix: '', color: 'from-emerald-400 to-teal-500' },
  { icon: Server, label: 'API routers', value: 19, suffix: '', color: 'from-cyan-400 to-blue-500' },
  { icon: Layers, label: 'Dashboard views', value: 39, suffix: '', color: 'from-indigo-400 to-purple-500' },
  { icon: Workflow, label: 'Round types supported', value: 5, suffix: '', color: 'from-amber-400 to-orange-500' },
];

const pillars = [
  {
    icon: Server,
    title: 'Self-host on Node + Supabase',
    description: 'Vite-built frontend, Express API in /server, serverless handlers in /api, Supabase Postgres. Host the frontend anywhere static, the API anywhere Node 20+ runs.',
  },
  {
    icon: ShieldCheck,
    title: 'Authorization in two places',
    description: 'Postgres RLS gates direct reads from the browser; the Express middleware re-checks every privileged mutation. The service-role key never reaches the client.',
  },
  {
    icon: Workflow,
    title: 'Graph-based judging',
    description: 'Rounds connect via edges with conditions (always, if shortlisted, score threshold, manual). The linear and graph editors render the same workflow.',
  },
  {
    icon: Cog,
    title: 'Plain SQL migrations',
    description: 'No ORM. Migrations live in supabase/migrations/ and are applied with the Supabase CLI. Types regenerate from the live schema.',
  },
];

const useCountUp = (target: number, inView: boolean, duration = 1400) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, inView, duration]);
  return value;
};

const StatCard: React.FC<{ stat: typeof stats[number]; inView: boolean; delay: number }> = ({ stat, inView, delay }) => {
  const value = useCountUp(stat.value, inView);
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm overflow-hidden hover:border-white/30 hover:-translate-y-1 transition-all"
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity`} />
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight tabular-nums">
          {value.toLocaleString()}
          {stat.suffix}
        </div>
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{stat.label}</div>
      </div>
    </motion.div>
  );
};

const StackPanel: React.FC = () => {
  const layers = [
    { name: 'components/ + src/', desc: 'React 19 · Vite 6 · Tailwind v4 · Framer Motion', tone: 'from-indigo-500/30 to-purple-500/30' },
    { name: 'server/', desc: 'Node + Express 4 · tsx in dev', tone: 'from-cyan-500/30 to-blue-500/30' },
    { name: 'api/', desc: 'Serverless route handlers (Vercel)', tone: 'from-rose-500/30 to-pink-500/30' },
    { name: 'supabase/migrations/', desc: 'Plain SQL · Postgres + RLS', tone: 'from-emerald-500/30 to-teal-500/30' },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-[2.5rem] blur-3xl opacity-60 pointer-events-none" />
      <div className="relative rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden">
        {/* Glass top highlight */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Architecture</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
          </span>
        </div>

        <div className="p-5 space-y-2.5">
          {layers.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-4"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${l.tone} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-white font-mono">{l.name}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{l.desc}</div>
                </div>
                <div className="text-[10px] text-white/40 font-mono">↳ {String(i + 1).padStart(2, '0')}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-white/40">npm · Vite · TypeScript</span>
          <span className="text-emerald-300 font-mono">GitHub</span>
        </div>
      </div>
    </div>
  );
};

export const OpenSourceShowcase: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background flourishes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 grid-bg-light opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-6"
          >
            <Github className="w-3.5 h-3.5" /> Built in the open
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-4xl md:text-6xl font-bold text-white mb-6 font-display tracking-tight"
          >
            An award platform you can{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              actually read the code of
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            AwardX is developed in public on GitHub. Every API route, every SQL migration,
            every dashboard view sits in the same repo &mdash; auditable, forkable, and yours to run.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} inView={inView} delay={0.2 + i * 0.08} />
          ))}
        </div>

        {/* Architecture + pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <StackPanel />

          <div className="space-y-6">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-400/30 transition-all">
                    <Icon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 font-display">{p.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{p.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Repo strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">Cognivo25/AwardX</h3>
              <p className="text-slate-400 text-sm">Open issues, file a pull request, or read the migration history straight on GitHub.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://github.com/Cognivo25/AwardX"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg"
              >
                <Github className="w-4 h-4" /> View repo
              </a>
              <a
                href="https://github.com/Cognivo25/AwardX/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors border border-white/15"
              >
                File an issue
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
