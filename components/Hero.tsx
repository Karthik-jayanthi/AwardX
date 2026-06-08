import React, { useRef } from 'react';
import { Github, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ── Brand marks ──────────────────────────────────────────────────────────────
// Inline SVGs traced from each brand's public mark. Kept monochrome where the
// tile is colored, full-color where the tile is white — matches the visual
// rhythm of the Veris reference (mix of colored and white tiles).

const SupabaseMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 109 113" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M63.7 110.3c-2.9 3.6-8.7 1.6-8.8-3l-1.2-67.6h45.5c8.3 0 12.9 9.5 7.8 16L63.7 110.3z" fill="currentColor" />
    <path d="M45.3 2.6c2.9-3.6 8.7-1.6 8.8 3l.5 67.6H9.7c-8.3 0-12.9-9.5-7.8-16L45.3 2.6z" fill="currentColor" opacity="0.55" />
  </svg>
);

// Stripe and Resend use the supplied wordmark SVGs from /public.
const StripeMark: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/stripe.svg" alt="Stripe" className={className} draggable={false} />
);

const RazorpayMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.4 4.3l-2.6 9.6 6.4-2.5 4.5-11.4-8.3 4.3zM5.8 32l3.5-13H4.6L0 32h5.8zm9.7-13l3.8-14.3-8.4 4.3L4 32h11.5l3.7-13H15.5z" />
  </svg>
);

const ResendMark: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/resend.svg" alt="Resend" className={className} draggable={false} />
);

const ReactMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="-11.5 -10.23 23 20.46" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const VercelMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 76 65" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M37.6 0L75.2 65H0L37.6 0z" />
  </svg>
);

// ── Tile config ──────────────────────────────────────────────────────────────
// Variant 'white' = white tile with colored mark; 'solid' = brand-colored tile
// with the mark in white. Mixes look more designed than six identical tiles.

type Variant = 'white' | 'solid' | 'wordmark';
type OrbitNode = {
  label: string;
  pos: string;
  delay: number;
  variant: Variant;
  size: 'sm' | 'md' | 'lg';
  // For 'white' tiles: text-color class for the mark.
  // For 'solid' tiles: background class for the tile.
  // For 'wordmark' tiles: ignored (white tile, wordmark uses its own ink).
  accent: string;
  mark: React.FC<{ className?: string }>;
};

const orbitNodes: OrbitNode[] = [
  {
    label: 'Supabase',
    pos: 'top-[10%] left-[4%]',
    delay: 0.15,
    variant: 'white',
    size: 'lg',
    accent: 'text-emerald-500',
    mark: SupabaseMark,
  },
  {
    label: 'Stripe',
    pos: 'top-[2%] right-[6%]',
    delay: 0.25,
    variant: 'wordmark',
    size: 'md',
    accent: '',
    mark: StripeMark,
  },
  {
    label: 'React',
    pos: 'top-[38%] left-[-2%]',
    delay: 0.35,
    variant: 'white',
    size: 'md',
    accent: 'text-[#58C4DC]',
    mark: ReactMark,
  },
  {
    label: 'Resend',
    pos: 'top-[36%] right-[-4%]',
    delay: 0.45,
    variant: 'wordmark',
    size: 'lg',
    accent: '',
    mark: ResendMark,
  },
  {
    label: 'Razorpay',
    pos: 'bottom-[10%] left-[6%]',
    delay: 0.55,
    variant: 'solid',
    size: 'md',
    accent: 'bg-[#0D2366]',
    mark: RazorpayMark,
  },
  {
    label: 'Vercel',
    pos: 'bottom-[4%] right-[6%]',
    delay: 0.65,
    variant: 'white',
    size: 'sm',
    accent: 'text-slate-900',
    mark: VercelMark,
  },
];

// Square tiles for icon marks vs. wider tiles for landscape wordmarks.
const SIZE_CLASS: Record<OrbitNode['size'], { square: string; wide: string; mark: string; wordmark: string }> = {
  sm: { square: 'w-14 h-14 rounded-2xl',         wide: 'w-[104px] h-[52px] rounded-[18px] px-3', mark: 'w-6 h-6', wordmark: 'h-6'  },
  md: { square: 'w-16 h-16 rounded-2xl',         wide: 'w-[120px] h-[60px] rounded-[20px] px-4', mark: 'w-7 h-7', wordmark: 'h-7'  },
  lg: { square: 'w-[72px] h-[72px] rounded-[22px]', wide: 'w-[136px] h-[68px] rounded-[22px] px-4', mark: 'w-8 h-8', wordmark: 'h-8'  },
};

const OrbitTile: React.FC<{ node: OrbitNode }> = ({ node }) => {
  const sz = SIZE_CLASS[node.size];
  const Mark = node.mark;
  const isSolid = node.variant === 'solid';
  const isWord = node.variant === 'wordmark';
  const tileShape = isWord ? sz.wide : sz.square;
  const markSize = isWord ? sz.wordmark + ' w-auto' : sz.mark;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: node.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${node.pos} hidden md:block`}
      aria-hidden="true"
    >
      <div
        title={node.label}
        className={`${tileShape} ${
          isSolid
            ? `${node.accent} shadow-[0_14px_36px_-10px_rgba(15,23,42,0.32)]`
            : 'bg-white border border-slate-200/80 shadow-[0_12px_32px_-10px_rgba(15,23,42,0.18)]'
        } flex items-center justify-center animate-float backdrop-blur-sm overflow-hidden`}
        style={{ animationDelay: `${node.delay}s` }}
      >
        <Mark className={`${markSize} ${isWord ? '' : isSolid ? 'text-white' : node.accent} object-contain`} />
      </div>
    </motion.div>
  );
};

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const dashY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative pt-28 pb-24 lg:pt-36 overflow-hidden bg-white">
      {/* Concentric dotted rings — the Veris-style backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center" aria-hidden="true">
        <div className="relative mt-20 w-[1400px] h-[1400px] max-w-none">
          {[260, 420, 580, 740, 900, 1080].map((size) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-200"
              style={{ width: size, height: size }}
            />
          ))}
          {/* soft glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-100/40 via-transparent to-cyan-100/40 blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Orbit container holds the headline + the floating integration tiles */}
        <div className="relative max-w-4xl mx-auto pt-6 pb-2">
          {orbitNodes.map((n) => (
            <OrbitTile key={n.label} node={n} />
          ))}

          {/* Eyebrow — built in public, no fabricated count */}
          <motion.a
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            href="https://github.com/Cognivo25/AwardX"
            target="_blank"
            rel="noreferrer"
            className="mx-auto mb-7 flex w-fit items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 transition-colors"
          >
            <span className="flex -space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 border-2 border-white" />
            </span>
            <span className="text-slate-900 font-bold">Built in public</span>
            <span className="text-slate-500">on GitHub</span>
            <Github className="w-3.5 h-3.5 text-slate-400" />
          </motion.a>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="text-center text-[44px] sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] text-slate-900 leading-[1.05] font-display"
          >
            Run your awards <br className="hidden sm:block" />
            end-to-end, in one workspace.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 mx-auto max-w-2xl text-center text-base sm:text-lg text-slate-500 leading-relaxed"
          >
            Build the entry form, configure rounds and judges, collect public votes,
            charge for entries, and announce winners &mdash; without bolting together five tools.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_6px_24px_-6px_rgba(15,23,42,0.45)] hover:bg-slate-800 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/demo')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-7 py-3.5 text-[15px] font-semibold text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              See Demo
            </button>
          </motion.div>
        </div>

        {/* Dashboard screenshot — the real AwardX events view */}
        <motion.div
          style={{ y: dashY }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
          className="relative mt-16 sm:mt-20 mx-auto max-w-6xl"
        >
          {/* Glow under the panel */}
          <div className="absolute inset-x-12 -bottom-6 h-24 bg-gradient-to-t from-indigo-200/40 via-purple-100/20 to-transparent blur-2xl rounded-[3rem] pointer-events-none" />

          <div className="relative rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] overflow-hidden">
            <img
              src="/hero-dashboard.png"
              alt="AwardX events dashboard showing program tiles and key metrics"
              className="block w-full h-auto select-none"
              draggable={false}
            />
            {/* Fade to white at the bottom so the screenshot dissolves into the page */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
