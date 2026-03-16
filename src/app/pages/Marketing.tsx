import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  BookOpen, Users, Award, Monitor, Languages, Calculator, Palette,
  Calendar, FileCheck, Wallet, Bot, Briefcase, Shield, Zap,
  ClipboardCheck, Building2, CreditCard, BarChart3, UserCog, LayoutDashboard,
} from 'lucide-react';
import { Sparkles } from 'lucide-react';

const btcLogo = '/images/btc-logo.png';

const FEATURES_LEFT = [
  { icon: Languages, title: 'Multi-Language Programs', desc: 'English, French, Swahili — beginner to advanced.' },
  { icon: Monitor, title: 'Professional & Tech Tracks', desc: 'Computer Science, Accounting, Graphic Design.' },
  { icon: BookOpen, title: 'Structured Lessons & Classes', desc: 'Programs, promotions, schedules by department.' },
  { icon: ClipboardCheck, title: 'Exercises, Quizzes & Assignments', desc: 'Create, assign to class events; students submit, teachers grade.' },
  { icon: LayoutDashboard, title: 'Student Portal & My Courses', desc: 'Dashboard, progress, submissions per enrollment.' },
  { icon: Award, title: 'Digital Certificates', desc: 'Verifiable certificates with unique codes.' },
  { icon: Calendar, title: 'Attendance & Calendar', desc: 'Request with location; teachers approve. Calendar view.' },
  { icon: Bot, title: 'AI Learning Assistant', desc: 'In-app AI for practice and exam prep.' },
  { icon: Briefcase, title: 'Job Placement Board', desc: 'Exclusive listings for graduates.' },
];

const FEATURES_RIGHT = [
  { icon: Users, title: 'Student Community', desc: 'Discussion and networking; blended support.' },
  { icon: UserCog, title: 'People & Staff Management', desc: 'Students, staff, roles; staff schedules per week.' },
  { icon: Building2, title: 'Academic Structure', desc: 'Departments, programs, fees, enrollments, classes.' },
  { icon: FileCheck, title: 'Teacher Attendance & Pay', desc: 'Staff mark attendance; admin approves, credits wallets.' },
  { icon: Wallet, title: 'Teacher Wallets', desc: 'Balance, credits, advances, adjustments.' },
  { icon: CreditCard, title: 'Finance & Payments', desc: 'Exchange rates, student payments, approval workflow.' },
  { icon: BarChart3, title: 'Reports & Certificates', desc: 'Reporting and certificate management.' },
  { icon: Shield, title: 'Safe & Inclusive', desc: 'Role-based access; secure environment.' },
  { icon: Zap, title: 'Blended & Flexible', desc: 'In-person and online in one platform.' },
];

export function Marketing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-[#0a0a0b]">
      {/* Luxe background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(202, 138, 4, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 20% 50%, rgba(34, 197, 94, 0.04) 0%, transparent 40%)
            `,
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
          animate={{ opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg, transparent_0%, rgba(0,0,0,0.2)_100%)]" />
      </div>

      {/* Animated vector BG — many floating shapes + SVG lines/circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { w: 60, h: 60, left: '5%', top: '10%', d: 0, dur: 7, rot: [0, 12, 0], y: [-6, 8, -6], r: 999 },
          { w: 44, h: 44, left: '88%', top: '15%', d: 0.4, dur: 8, rot: [0, -15, 0], y: [4, -8, 4], r: 8 },
          { w: 72, h: 72, left: '75%', top: '70%', d: 0.2, dur: 6, rot: [5, -5, 5], y: [-8, 6, -8], r: 16 },
          { w: 36, h: 36, left: '12%', top: '65%', d: 0.6, dur: 5, rot: [0, 22, 0], y: [5, -7, 5], r: 999 },
          { w: 50, h: 18, left: '52%', top: '6%', d: 0.3, dur: 9, rot: [-4, 4, -4], y: [-4, 6, -4], r: 4 },
          { w: 48, h: 48, left: '22%', top: '32%', d: 0.5, dur: 6.5, rot: [0, -18, 0], y: [6, -10, 6], r: 12 },
          { w: 56, h: 56, left: '82%', top: '38%', d: 0.1, dur: 7.5, rot: [8, -8, 8], y: [-8, 5, -8], r: 20 },
          { w: 32, h: 32, left: '8%', top: '45%', d: 0.7, dur: 5.5, rot: [0, 28, 0], y: [4, -6, 4], r: 999 },
          { w: 40, h: 40, left: '92%', top: '52%', d: 0.35, dur: 6, rot: [-6, 6, -6], y: [-5, 7, -5], r: 6 },
          { w: 52, h: 52, left: '35%', top: '78%', d: 0.25, dur: 8, rot: [0, -12, 0], y: [7, -9, 7], r: 999 },
          { w: 64, h: 64, left: '90%', top: '25%', d: 0.55, dur: 7, rot: [6, -6, 6], y: [-6, 8, -6], r: 14 },
          { w: 28, h: 28, left: '15%', top: '85%', d: 0.45, dur: 5, rot: [0, 32, 0], y: [3, -5, 3], r: 999 },
          { w: 68, h: 68, left: '58%', top: '12%', d: 0.15, dur: 6.8, rot: [-4, 4, -4], y: [-7, 9, -7], r: 10 },
          { w: 38, h: 38, left: '38%', top: '18%', d: 0.65, dur: 5.2, rot: [0, -24, 0], y: [6, -8, 6], r: 999 },
          { w: 54, h: 54, left: '18%', top: '52%', d: 0.4, dur: 7.2, rot: [4, -4, 4], y: [-5, 7, -5], r: 8 },
          { w: 46, h: 46, left: '94%', top: '62%', d: 0.5, dur: 6.2, rot: [0, 14, 0], y: [8, -10, 8], r: 10 },
          { w: 42, h: 42, left: '28%', top: '5%', d: 0.8, dur: 8.2, rot: [-5, 5, -5], y: [-7, 5, -7], r: 999 },
          { w: 58, h: 58, left: '4%', top: '25%', d: 0.2, dur: 5.8, rot: [0, -18, 0], y: [4, -6, 4], r: 18 },
          { w: 50, h: 50, left: '78%', top: '82%', d: 0.6, dur: 7.8, rot: [7, -7, 7], y: [-9, 6, -9], r: 999 },
          { w: 34, h: 34, left: '48%', top: '58%', d: 0.55, dur: 6.4, rot: [0, 26, 0], y: [5, -8, 5], r: 4 },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="absolute border"
            style={{
              width: s.w,
              height: s.h,
              left: s.left,
              top: s.top,
              borderRadius: s.r === 999 ? '50%' : s.r,
              borderColor: 'rgba(202, 138, 4, 0.08)',
              background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.06), rgba(34, 197, 94, 0.03))',
            }}
            animate={{ y: s.y, rotate: s.rot, opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.d }}
          />
        ))}
        <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mvGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="mvGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {[
            [0, 100, 1200, 120], [0, 280, 1200, 300], [0, 460, 1200, 480], [0, 640, 1200, 660],
            [100, 0, 150, 800], [400, 0, 380, 800], [700, 0, 720, 800], [1000, 0, 980, 800],
            [50, 0, 220, 800], [320, 0, 280, 800], [580, 0, 620, 800], [880, 0, 920, 800],
          ].map(([x1, y1, x2, y2], i) => (
            <motion.line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#mvGrad1)"
              strokeWidth="0.4"
              animate={{ opacity: [0.06, 0.18, 0.06] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
            />
          ))}
          {[
            { cx: 180, cy: 140, r: 100 },
            { cx: 1020, cy: 380, r: 160 },
            { cx: 580, cy: 620, r: 90 },
            { cx: 120, cy: 480, r: 70 },
            { cx: 920, cy: 100, r: 50 },
            { cx: 380, cy: 320, r: 120 },
            { cx: 820, cy: 550, r: 80 },
            { cx: 600, cy: 400, r: 200 },
          ].map((c, i) => (
            <motion.circle
              key={`circle-${i}`}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              stroke="url(#mvGrad2)"
              strokeWidth="0.35"
              fill="none"
              animate={{ opacity: [0.04, 0.12, 0.04] }}
              transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
            />
          ))}
          {[
            'M 0 180 Q 350 80 700 220 T 1200 160',
            'M 0 420 Q 280 320 600 480 T 1200 400',
            'M 1200 320 Q 650 220 280 380 T 0 300',
            'M 550 0 V 800',
            'M 180 0 V 800',
            'M 950 0 V 800',
          ].map((d, i) => (
            <motion.path
              key={`path-${i}`}
              d={d}
              stroke="rgba(202, 138, 4, 0.06)"
              strokeWidth="0.4"
              fill="none"
              animate={{ opacity: [0.04, 0.1, 0.04] }}
              transition={{ duration: 7 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}
        </svg>
      </div>

      {/* Subtle gold accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
        initial={{ scaleX: 0 }}
        animate={mounted ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '50% 0' }}
      />

      {/* Branch lines: SVG curves from center (logo) to left and right columns */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="branchLeft" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="rgba(202, 138, 4, 0)" />
            <stop offset="40%" stopColor="rgba(202, 138, 4, 0.08)" />
            <stop offset="100%" stopColor="rgba(202, 138, 4, 0.2)" />
          </linearGradient>
          <linearGradient id="branchRight" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0)" />
            <stop offset="40%" stopColor="rgba(34, 197, 94, 0.08)" />
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0.2)" />
          </linearGradient>
        </defs>
        {/* Left branch: curve from center toward left */}
        <motion.path
          d="M 50 48 Q 32 48 18 50 T 5 50"
          fill="none"
          stroke="url(#branchLeft)"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={mounted ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Right branch: curve from center toward right */}
        <motion.path
          d="M 50 48 Q 68 48 82 50 T 95 50"
          fill="none"
          stroke="url(#branchRight)"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={mounted ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-center px-4 py-6 overflow-auto">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-stretch lg:items-center gap-6 lg:gap-4">
          {/* Left branch: features list with flow connectors */}
          <motion.div
            className="hidden lg:flex flex-col justify-center w-full lg:max-w-[260px] xl:max-w-[300px] flex-shrink-0 pl-2"
            initial={{ opacity: 0, x: -20 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -right-px top-1/2 -translate-y-1/2 w-px h-[70%] bg-gradient-to-b from-transparent via-amber-500/25 to-transparent" aria-hidden />
              <div className="relative flex flex-col gap-0">
                {FEATURES_LEFT.map((item, i) => (
                  <div key={i} className="flex flex-col gap-0">
                    <motion.div
                      className="flex gap-3 py-2.5 pl-4 pr-3 rounded-r-lg border-l-2 border-amber-500/25 hover:border-amber-500/50 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 relative"
                      initial={{ opacity: 0, x: -16 }}
                      animate={mounted ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.35 + i * 0.045 }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0 text-amber-500/70 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-white/92 text-xs font-medium" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</p>
                        <p className="text-white/50 text-[10px] leading-snug mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                    {i < FEATURES_LEFT.length - 1 && (
                      <div className="flex justify-start pl-5 py-0.5" aria-hidden>
                        <svg
                          width="24"
                          height="20"
                          viewBox="0 0 24 20"
                          fill="none"
                          className="text-amber-500/50 overflow-visible"
                        >
                          <motion.path
                            d="M 2 0 L 2 10 Q 2 14 6 14 L 8 14 L 8 20"
                            stroke="rgba(202, 138, 4, 0.55)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={mounted ? { pathLength: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.5 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
                          />
                          <motion.circle
                            cx="8"
                            cy="20"
                            r="2"
                            fill="rgba(202, 138, 4, 0.45)"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={mounted ? { scale: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.2, delay: 0.75 + i * 0.045 }}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Center: logo + launch — the core */}
          <div className="flex flex-col items-center justify-center text-center flex-shrink-0 px-4 lg:px-2">
            <motion.div
              className="relative mb-6 sm:mb-8"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute -inset-4 rounded-full opacity-0"
                style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)' }}
                animate={mounted ? { opacity: [0, 0.6, 0.3] } : {}}
                transition={{ duration: 2.5, delay: 0.3, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.img
                src={btcLogo}
                alt="Brotherly Training Center"
                className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl object-contain bg-white/95 shadow-2xl ring-1 ring-white/20"
                animate={mounted ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <motion.p
              className="text-amber-500/90 text-xs sm:text-sm tracking-[0.35em] uppercase mb-3 font-medium"
              style={{ fontFamily: 'Georgia, serif' }}
              initial={{ opacity: 0, y: 10 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              Brotherly Training Center
            </motion.p>
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-tight max-w-xl mx-auto mb-3"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              initial={{ opacity: 0, y: 14 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Ready to go{' '}
              <span className="text-emerald-400/95 font-normal italic">online</span>
            </motion.h1>
            <motion.p
              className="text-white/50 text-xs sm:text-sm max-w-sm mx-auto mb-8"
              style={{ fontFamily: 'Georgia, serif' }}
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Your learning platform — languages, vocational training, and growth. Goma, Nord-Kivu.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Link
                to="/"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-amber-500/40 bg-amber-500/5 text-amber-200/90 text-sm font-medium tracking-wide hover:bg-amber-500/15 hover:border-amber-500/60 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4 text-amber-400/80 group-hover:scale-110 transition-transform" />
                Enter the platform
              </Link>
            </motion.div>
          </div>

          {/* Right branch: features list with flow connectors */}
          <motion.div
            className="hidden lg:flex flex-col justify-center w-full lg:max-w-[260px] xl:max-w-[300px] flex-shrink-0 pr-2"
            initial={{ opacity: 0, x: 20 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -left-px top-1/2 -translate-y-1/2 w-px h-[70%] bg-gradient-to-b from-transparent via-emerald-500/25 to-transparent" aria-hidden />
              <div className="relative flex flex-col gap-0">
                {FEATURES_RIGHT.map((item, i) => (
                  <div key={i} className="flex flex-col gap-0">
                    <motion.div
                      className="flex gap-3 py-2.5 pl-3 pr-4 rounded-l-lg border-r-2 border-emerald-500/25 hover:border-emerald-500/50 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 relative"
                      initial={{ opacity: 0, x: 16 }}
                      animate={mounted ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.35 + i * 0.045 }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0 text-emerald-500/70 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-white/92 text-xs font-medium" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</p>
                        <p className="text-white/50 text-[10px] leading-snug mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                    {i < FEATURES_RIGHT.length - 1 && (
                      <div className="flex justify-end pr-5 py-0.5" aria-hidden>
                        <svg
                          width="24"
                          height="20"
                          viewBox="0 0 24 20"
                          fill="none"
                          className="text-emerald-500/50 -scale-x-100 overflow-visible"
                        >
                          <motion.path
                            d="M 2 0 L 2 10 Q 2 14 6 14 L 8 14 L 8 20"
                            stroke="rgba(34, 197, 94, 0.55)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={mounted ? { pathLength: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.5 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
                          />
                          <motion.circle
                            cx="8"
                            cy="20"
                            r="2"
                            fill="rgba(34, 197, 94, 0.45)"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={mounted ? { scale: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.2, delay: 0.75 + i * 0.045 }}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile: compact features below center */}
        <div className="lg:hidden w-full max-w-2xl mx-auto mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {FEATURES_LEFT.slice(0, 5).map((item, i) => (
              <motion.div key={`l-${i}`} className="flex gap-2 py-1" initial={{ opacity: 0 }} animate={mounted ? { opacity: 1 } : {}} transition={{ delay: 0.2 + i * 0.03 }}>
                <item.icon className="w-3 h-3 flex-shrink-0 text-amber-500/50 mt-0.5" />
                <p className="text-white/70 text-[10px] leading-tight truncate">{item.title}</p>
              </motion.div>
            ))}
            {FEATURES_RIGHT.slice(0, 5).map((item, i) => (
              <motion.div key={`r-${i}`} className="flex gap-2 py-1" initial={{ opacity: 0 }} animate={mounted ? { opacity: 1 } : {}} transition={{ delay: 0.25 + i * 0.03 }}>
                <item.icon className="w-3 h-3 flex-shrink-0 text-emerald-500/50 mt-0.5" />
                <p className="text-white/70 text-[10px] leading-tight truncate">{item.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
        initial={{ scaleX: 0 }}
        animate={mounted ? { scaleX: 1 } : {}}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '50% 100%' }}
      />

      {/* Back link - minimal */}
      <motion.div
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <Link
          to="/"
          className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider uppercase"
        >
          Back
        </Link>
      </motion.div>
    </section>
  );
}
