import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, Play, Github, Star, GitFork } from 'lucide-react';
import { Button } from './Button';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Hero: React.FC = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const brandingY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  // Typing Effect Logic
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = [
    "Awards Programs",
    "Creative Competitions",
    "Grants & Funding",
    "Recognition Cycles",
  ];


  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, phrases]);

  return (
    <section ref={ref} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-background">
      {/* Background Branding */}
      <motion.div 
        style={{ y: brandingY }}
        className="absolute top-20 left-1/2 -translate-x-1/2 text-[18vw] font-black text-slate-50 opacity-80 pointer-events-none select-none z-0 tracking-tighter font-display"
      >
        AwardX
      </motion.div>

      {/* Abstract Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[30%] -right-[10%] w-[80%] h-[80%] bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-tr from-cyan-100/50 to-blue-100/50 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 w-full h-[500px] bg-gradient-to-t from-white via-white to-transparent z-10"></div>
        <div className="absolute inset-0 grid-bg-light opacity-[0.6] z-0"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* Left Content */}
          <motion.div 
            className="lg:w-1/2 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a
              href="https://github.com/Cognivo25/AwardX"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-1.5 rounded-full border border-indigo-100 bg-white/80 backdrop-blur-sm text-indigo-700 text-sm font-bold tracking-wide mb-8 shadow-sm hover:border-indigo-300 hover:shadow transition-all"
            >
              <span className="flex h-2 w-2 mr-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              SOURCE AVAILABLE · BUILT IN PUBLIC
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </a>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1] min-h-[3.3em] lg:min-h-[auto] font-display">
              The OS for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                {text}
                <span className="border-r-4 border-indigo-600 ml-1 animate-pulse"></span>
              </span>
            </h1>

            <p className="mt-4 text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              The award management system for running serious programs &mdash; entry intake,
              multi-round judging, public voting, and winner announcement, all in one
              workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-indigo-500/25 rounded-full px-8"
                onClick={() => window.open('https://github.com/Cognivo25/AwardX', '_blank', 'noreferrer')}
              >
                <Github className="mr-2 w-4 h-4" /> View on GitHub
              </Button>
              <Button variant="white" size="lg" className="w-full sm:w-auto font-bold rounded-full px-8">
                <Play className="mr-2 w-4 h-4 fill-slate-900" /> Live Demo
              </Button>
            </div>

            {/* Stack chips — grounded in package.json + server/package.json */}
            <div className="mt-6 inline-flex items-center gap-2 flex-wrap">
              {['React 19', 'TypeScript', 'Supabase', 'Tailwind v4'].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Visuals - Parallax Elements */}
          <div className="lg:w-1/2 relative h-[500px] w-full max-w-xl lg:max-w-none mx-auto">
            {/* Background Blob */}
            <motion.div 
              style={{ y: y1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full blur-[80px] opacity-20" 
            />

            {/* Main Dashboard Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 z-10"
              style={{ perspective: '1000px' }}
            >
              <div className="w-full h-full bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-indigo-900/20 border border-white/60 overflow-hidden relative transform transition-transform hover:scale-[1.02] duration-500 group">
                {/* Header — mirrors the real top-nav (DashboardLayout.tsx) */}
                <div className="h-11 border-b border-slate-100/70 flex items-center px-5 gap-4 bg-white/40 backdrop-blur-xl">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="flex items-center gap-1 ml-2 overflow-hidden">
                    {['Overview', 'Submissions', 'Judging', 'Awards'].map((label, idx) => (
                      <span
                        key={label}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                          idx === 1 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="ml-auto text-[9px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">⌘K</span>
                  </div>
                </div>

                {/* Body — animated stats + submissions list grounded in dashboard */}
                <div className="p-5 relative">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Entries', value: '1,284', tone: 'bg-slate-900 text-white' },
                      { label: 'Pending', value: '37', tone: 'bg-amber-100 text-amber-900' },
                      { label: 'Round', value: '2 / 4', tone: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-100 p-2.5">
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{s.label}</div>
                        <div className={`text-sm font-bold rounded-md px-2 py-1 inline-block ${s.tone}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini submissions list with staggered shimmer */}
                  <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-100 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recent Submissions</span>
                      <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> live
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100/70">
                      {[
                        { id: 'SUB-1042', title: 'Helios Pavilion', tag: 'Submitted', tone: 'bg-emerald-100 text-emerald-700' },
                        { id: 'SUB-1041', title: 'Quanta Engine', tag: 'In Review', tone: 'bg-amber-100 text-amber-700' },
                        { id: 'SUB-1040', title: 'Northwind Atlas', tag: 'Advanced', tone: 'bg-indigo-100 text-indigo-700' },
                      ].map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="px-3 py-2 flex items-center gap-2"
                        >
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-[8px] font-mono text-indigo-700 font-bold">
                            {r.id.split('-')[1].slice(-2)}
                          </div>
                          <span className="text-[11px] font-medium text-slate-800 flex-1 truncate">{r.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.tone}`}>{r.tag}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Elements - Parallax */}
            <motion.div style={{ y: y2 }} className="absolute -top-10 -right-10 z-20">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 w-56 animate-float">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                    <Star size={20} className="fill-current" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Voting</div>
                    <div className="text-sm font-bold text-slate-900">Round 3 <span className="text-emerald-600 text-xs font-semibold">open</span></div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 h-6 bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-sm" style={{ opacity: 0.4 + (i / 24) }} />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div style={{ y: y3 }} className="absolute -bottom-5 -left-5 z-30">
              <div className="bg-white/70 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 w-64 animate-float animation-delay-2000">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white shadow-md">
                    <GitFork size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Round 2 · Jury</div>
                    <div className="text-[11px] font-bold text-slate-900">12 of 24 scored</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '50%' }}
                    transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};