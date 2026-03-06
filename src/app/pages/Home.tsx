import { useState, useEffect, useRef } from 'react';
import {
  Globe, BookOpen, Award, Users, ArrowRight, Star, CheckCircle,
  Play, ChevronLeft, ChevronRight, MapPin, Clock, TrendingUp, Zap,
  Languages, Briefcase, Monitor, Calculator, Palette, Shield, GraduationCap,
  Bot, Sparkles, Building2
} from 'lucide-react';
import btcLogo from 'figma:asset/a830ae5c9e57e0e708aaa9224b0dd9363e9028d9.png';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { useLanguage } from '../../context/LanguageContext';

import heroImg from 'figma:asset/2f69225f7b4c2e09bf8d79ebbc71990dcbef7d10.png';
const studentsImg = 'https://images.unsplash.com/photo-1747173708417-06828e9970ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGFmcmljYW4lMjBzdHVkZW50cyUyMGdyYWR1YXRpb24lMjBjZXJlbW9ueXxlbnwxfHx8fDE3NzI3MzM0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080';
import trainingImg from 'figma:asset/6a04928782d55da419b2810286f18ce0d02b12d3.png';
const onlineImg = 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGxhcHRvcCUyMGVkdWNhdGlvbiUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcyNzMzNDc2fDA&ixlib=rb-4.1.0&q=80&w=1080';
import teacherImg from 'figma:asset/5b146961802a0693c4f2101423b15fe979ad824e.png';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (target / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ---- Apple-style Background Decorations ----

function IcyGridBg({ variant = 'light' }: { variant?: 'light' | 'dark' | 'green' }) {
  const colors = {
    light: { line: 'rgba(22,163,74,0.06)', orb1: 'rgba(22,163,74,0.08)', orb2: 'rgba(6,182,212,0.06)', orb3: 'rgba(124,58,237,0.05)' },
    dark: { line: 'rgba(74,222,128,0.04)', orb1: 'rgba(22,163,74,0.1)', orb2: 'rgba(6,182,212,0.08)', orb3: 'rgba(124,58,237,0.06)' },
    green: { line: 'rgba(255,255,255,0.08)', orb1: 'rgba(255,255,255,0.06)', orb2: 'rgba(134,239,172,0.1)', orb3: 'rgba(6,182,212,0.08)' },
  };
  const c = colors[variant];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${variant}`} width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={c.line} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${variant})`} />
      </svg>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <line x1="0%" y1="20%" x2="100%" y2="80%" stroke={c.line} strokeWidth="1" />
        <line x1="100%" y1="10%" x2="0%" y2="90%" stroke={c.line} strokeWidth="0.5" />
        <line x1="30%" y1="0%" x2="70%" y2="100%" stroke={c.line} strokeWidth="0.5" />
      </svg>
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${c.orb1} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${c.orb2} 0%, transparent 70%)` }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-50" style={{ background: `radial-gradient(circle, ${c.orb3} 0%, transparent 60%)` }} />
    </div>
  );
}

function GlassVectors({ color = '#16a34a' }: { color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-16 right-[15%] w-32 h-32 rounded-3xl border border-white/10 backdrop-blur-sm"
        style={{ background: `linear-gradient(135deg, ${color}08, ${color}03)` }}
      />
      <motion.div
        animate={{ y: [10, -15, 10], rotate: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-20 left-[10%] w-24 h-24 rounded-full border border-white/10"
        style={{ background: `linear-gradient(135deg, ${color}06, transparent)` }}
      />
      <motion.div
        animate={{ y: [5, -10, 5], x: [-5, 5, -5] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 left-[5%] w-20 h-20 rotate-45 rounded-2xl border border-white/5"
        style={{ background: `linear-gradient(135deg, ${color}05, transparent)` }}
      />
      <svg className="absolute top-0 right-0 w-1/2 h-full opacity-30" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 400 0 Q 200 300 400 600" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
        <path d="M 350 0 Q 150 300 350 600" stroke={color} strokeWidth="0.3" strokeOpacity="0.1" fill="none" />
        <circle cx="300" cy="200" r="80" stroke={color} strokeWidth="0.3" strokeOpacity="0.08" fill="none" />
        <circle cx="350" cy="400" r="50" stroke={color} strokeWidth="0.3" strokeOpacity="0.06" fill="none" />
      </svg>
    </div>
  );
}

function IcyMeshBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 30%, rgba(22,163,74,0.07) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 70%, rgba(6,182,212,0.06) 0%, transparent 50%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 50%)
        `
      }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <circle cx="400" cy="400" r="300" stroke="#16a34a" strokeWidth="1" fill="none" />
        <circle cx="400" cy="400" r="250" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
        <circle cx="400" cy="400" r="350" stroke="#16a34a" strokeWidth="0.3" fill="none" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 400 + 250 * Math.cos(angle);
          const y1 = 400 + 250 * Math.sin(angle);
          const x2 = 400 + 350 * Math.cos(angle);
          const y2 = 400 + 350 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#16a34a" strokeWidth="0.3" />;
        })}
      </svg>
    </div>
  );
}

// ---- Data ----

const programs = [
  { icon: Languages, title: 'English Language', level: 'Beginner to Advanced', duration: '3-12 months', price: '$50/month', color: '#16a34a', desc: 'Master English for global communication, business, and academic success.' },
  { icon: Globe, title: 'French Language', level: 'All Levels', duration: '3-12 months', price: '$45/month', color: '#2563eb', desc: 'Learn French -- the diplomatic language and key to professional opportunities in Africa.' },
  { icon: Languages, title: 'Swahili Language', level: 'All Levels', duration: '2-6 months', price: '$35/month', color: '#7c3aed', desc: 'Communicate across East & Central Africa with professional Swahili skills.' },
  { icon: Monitor, title: 'Computer Science', level: 'Beginner to Pro', duration: '6-12 months', price: '$60/month', color: '#0891b2', desc: 'Web development, programming, office software, and digital literacy.' },
  { icon: Calculator, title: 'Accounting & Finance', level: 'Intermediate', duration: '6 months', price: '$55/month', color: '#ea580c', desc: 'Professional accounting skills for businesses and organizations.' },
  { icon: Palette, title: 'Graphic Design', level: 'All Levels', duration: '3-6 months', price: '$50/month', color: '#d946ef', desc: 'Creative design using Adobe Suite for branding, print, and digital media.' },
];

const testimonials = [
  { name: 'Amina Kabuya', role: 'English Graduate', text: 'BTC transformed my career. After just 6 months, I landed a job at an international NGO in Goma!', rating: 5, img: studentsImg },
  { name: 'Jean-Pierre Mutombo', role: 'Computer Science Student', text: 'The instructors are amazing and the curriculum is very practical. I now freelance as a web developer.', rating: 5, img: teacherImg },
  { name: 'Fatuma Hassan', role: 'French Language Graduate', text: 'BTC helped me pass my French certification exam. The environment is welcoming and inclusive.', rating: 5, img: studentsImg },
];

const features = [
  { icon: Award, title: 'Certified Programs', desc: 'Internationally recognized certificates accepted by employers worldwide.' },
  { icon: Users, title: 'Expert Staff', desc: 'Native and bilingual teachers with years of professional experience.' },
  { icon: Monitor, title: 'Blended Learning', desc: 'Combine in-person and online sessions for maximum flexibility.' },
  { icon: Shield, title: 'Safe Environment', desc: 'Inclusive, supportive, and secure learning community for all students.' },
  { icon: TrendingUp, title: 'Career Support', desc: 'Job placement assistance and professional development workshops.' },
  { icon: Zap, title: 'Fast Progress', desc: 'Intensive and accelerated programs designed for busy professionals.' },
];

export function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const { t } = useLanguage();

  const heroTexts = [
    { line1: t('hero.line1_1'), line2: t('hero.line2_1') },
    { line1: t('hero.line1_2'), line2: t('hero.line2_2') },
    { line1: t('hero.line1_3'), line2: t('hero.line2_3') },
  ];

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer2 = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer2);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ======================== HERO ======================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={teacherImg} alt="BTC" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-green-950/70" />
        </div>

        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/10"
            style={{ width: 200 + i * 120, height: 200 + i * 120, left: '60%', top: '50%', x: '-50%', y: '-50%' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute right-8 top-1/4 hidden lg:block"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white w-44">
            <div className="text-2xl font-bold" style={{ fontFamily: 'Poppins' }}>500+</div>
            <div className="text-sm text-white/80">Active Students</div>
            <div className="mt-2 flex gap-1">
              {[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-green-400" />)}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute right-8 top-1/2 hidden lg:block"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white w-44">
            <div className="text-2xl font-bold" style={{ fontFamily: 'Poppins' }}>20+</div>
            <div className="text-sm text-white/80">Expert Teachers</div>
            <div className="mt-2 flex items-center gap-1 text-yellow-400">
              <Star size={14} fill="currentColor" />
              <span className="text-xs">Top Rated</span>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm"
          >
            <img src={btcLogo} alt="BTC" className="w-6 h-6 rounded-full object-contain bg-white/90" />
            <span>AGAPD/Asbl -- BTC Goma, Nord-Kivu, DRC</span>
          </motion.div>

          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.h1
                key={heroIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="text-white mb-4"
                style={{ fontFamily: 'Poppins', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.15, fontWeight: 800 }}
              >
                {heroTexts[heroIndex].line1}<br />
                <span style={{ color: 'var(--btc-primary-light, #4ade80)' }}>{heroTexts[heroIndex].line2}</span>
              </motion.h1>
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-lg mb-8 leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/courses"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-base shadow-xl transition-all duration-200 hover:opacity-90 hover:shadow-2xl hover:-translate-y-0.5"
                style={{ background: 'var(--btc-primary,#16a34a)' }}
              >
                {t('hero.explorePrograms')} <ArrowRight size={18} />
              </Link>
              <Link
                to="/about"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-base border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                <Play size={18} />
                {t('hero.aboutBtc')}
              </Link>
            </motion.div>

            <div className="flex gap-2 mt-8">
              {heroTexts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className="transition-all duration-300 rounded-full h-2"
                  style={{ width: i === heroIndex ? 24 : 8, background: i === heroIndex ? 'var(--btc-primary-light,#4ade80)' : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-1"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 bg-white/70 rounded-full"
            />
          </div>
          <span className="text-xs">{t('hero.scroll')}</span>
        </motion.div>
      </section>

      {/* ======================== STATS ======================== */}
      <section className="relative py-16 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 overflow-hidden">
        <IcyGridBg variant="green" />
        <GlassVectors color="#ffffff" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, value: 500, suffix: '+', label: t('stats.studentsEnrolled'), sub: t('stats.sinceFoundation') },
              { icon: BookOpen, value: 20, suffix: '+', label: t('stats.activePrograms'), sub: t('stats.languagesAndTrades') },
              { icon: Award, value: 8, suffix: '+', label: t('stats.languagesTaught'), sub: t('stats.includingDialects') },
              { icon: Globe, value: 95, suffix: '%', label: t('stats.jobPlacementRate'), sub: t('stats.forGraduates') },
            ].map((stat, i) => (
              <AnimatedSection key={i}>
                <div className="text-center text-white">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <stat.icon size={22} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Poppins' }}>
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="font-medium">{stat.label}</div>
                  <div className="text-sm text-white/70">{stat.sub}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== ABOUT PREVIEW ======================== */}
      <section className="relative py-20 bg-white dark:bg-gray-950 overflow-hidden">
        <IcyMeshBg />
        <GlassVectors color="#16a34a" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="relative">
                <img src={trainingImg} alt="BTC Training" className="w-full h-80 object-cover rounded-2xl shadow-xl" />
                <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                      <Award size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">ISO Certified</p>
                      <p className="text-xs text-gray-500">Quality Education</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 bg-green-500 rounded-2xl p-3 text-white shadow-lg">
                  <div className="text-xl font-bold" style={{ fontFamily: 'Poppins' }}>10+</div>
                  <div className="text-xs">Years of Excellence</div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--btc-primary,#16a34a)' }}>
                <GraduationCap size={14} />
                {t('about.badge')}
              </div>
              <h2 className="text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2 }}>
                {t('about.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {t('about.p1')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t('about.p2')}
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  t('about.bullet1'),
                  t('about.bullet2'),
                  t('about.bullet3'),
                  t('about.bullet4'),
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={18} style={{ color: 'var(--btc-primary,#16a34a)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ background: 'var(--btc-primary,#16a34a)' }}
              >
                {t('about.learnMore')} <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ======================== PROGRAMS ======================== */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <IcyGridBg variant="light" />
        <GlassVectors color="#06b6d4" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--btc-primary,#16a34a)' }}>
              <BookOpen size={14} /> {t('programs.badge')}
            </div>
            <h2 className="text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              {t('programs.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('programs.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${prog.color}20` }}>
                  <prog.icon size={22} style={{ color: prog.color }} />
                </div>
                <h3 className="text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                  {prog.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{prog.desc}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Clock size={12} /> {prog.duration}</span>
                  <span className="flex items-center gap-1"><Award size={12} /> {prog.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: prog.color, fontFamily: 'Poppins' }}>{prog.price}</span>
                  <Link
                    to="/courses"
                    className="flex items-center gap-1 text-sm font-medium transition-all"
                    style={{ color: prog.color }}
                  >
                    Learn more <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all"
              style={{ background: 'var(--btc-primary,#16a34a)' }}
            >
              {t('programs.viewAll')} <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ======================== WHY BTC ======================== */}
      <section className="relative py-20 bg-white dark:bg-gray-950 overflow-hidden">
        <IcyMeshBg />
        <GlassVectors color="#7c3aed" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--btc-primary,#16a34a)' }}>
                <Zap size={14} /> {t('why.badge')}
              </div>
              <h2 className="text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2 }}>
                {t('why.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {t('why.subtitle')}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.1)' }}>
                      <f.icon size={16} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{f.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="relative">
                <img src={onlineImg} alt="Online Learning" className="w-full h-96 object-cover rounded-2xl shadow-xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
                  <p className="font-semibold mb-1">Online & In-Person</p>
                  <p className="text-sm text-white/80">Study from Goma or anywhere with our hybrid platform</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section className="relative py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a) 0%, var(--btc-primary-dark,#15803d) 100%)' }}>
        <IcyGridBg variant="green" />
        <GlassVectors color="#ffffff" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              {t('testimonials.title')}
            </h2>
            <p className="text-white/80">{t('testimonials.subtitle')}</p>
          </AnimatedSection>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center"
              >
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white text-lg mb-6 leading-relaxed italic">
                  "{testimonials[activeTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={testimonials[activeTestimonial].img}
                    alt={testimonials[activeTestimonial].name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                  />
                  <div className="text-left">
                    <p className="text-white font-semibold">{testimonials[activeTestimonial].name}</p>
                    <p className="text-white/70 text-sm">{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className="rounded-full h-2 transition-all duration-300"
                  style={{ width: i === activeTestimonial ? 24 : 8, background: i === activeTestimonial ? 'white' : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== PARTNERS ======================== */}
      <section className="relative py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <IcyGridBg variant="light" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('partners.trustedBy')}</p>
            <h2 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
              {t('partners.title')}
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'MONUSCO', sub: 'UN Mission' },
              { name: 'Alliance Francaise', sub: 'Goma' },
              { name: 'USAID', sub: 'Development' },
              { name: 'Cambridge', sub: 'English Testing' },
              { name: 'Microsoft', sub: 'Digital Skills' },
              { name: 'AGAPD/Asbl', sub: 'Parent NGO' },
            ].map((partner, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                  <Building2 size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{partner.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{partner.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== STUDENT PORTAL + AI ======================== */}
      <section className="relative py-20 bg-white dark:bg-gray-950 overflow-hidden">
        <IcyMeshBg />
        <GlassVectors color="#16a34a" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--btc-primary,#16a34a)' }}>
              <Sparkles size={14} /> {t('portal.badge')}
            </div>
            <h2 className="text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              {t('portal.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('portal.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Course Dashboard', desc: 'Track progress, access lessons, submit assignments, and review grades all in one place.', color: '#16a34a', link: '/portal/courses' },
              { icon: Bot, title: 'AI Learning Assistant', desc: 'Get instant help with your studies -- practice languages, explain concepts, and prepare for exams.', color: '#7c3aed', link: '/portal/ai-assistant' },
              { icon: Award, title: 'Digital Certificates', desc: 'Earn verifiable certificates with unique IDs. Share them on LinkedIn and with employers.', color: '#2563eb', link: '/portal/certificates' },
              { icon: Briefcase, title: 'Job Placement Board', desc: 'Access exclusive job listings from NGOs, companies, and organizations hiring BTC graduates.', color: '#ea580c', link: '/portal/jobs' },
              { icon: Users, title: 'Student Community', desc: 'Join study groups, participate in discussions, and network with fellow students.', color: '#d946ef', link: '/portal/community' },
              { icon: Monitor, title: 'Blended Learning', desc: 'Attend in-person classes or study online -- our platform supports both seamlessly.', color: '#0891b2', link: '/portal' },
            ].map((feature, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feature.color}15` }}>
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{feature.desc}</p>
                <Link to={feature.link} className="text-sm font-medium flex items-center gap-1 transition-all" style={{ color: feature.color }}>
                  Explore <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12">
            <Link to="/portal"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--btc-primary,#16a34a)' }}>
              {t('portal.enter')} <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ======================== CTA ======================== */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <IcyGridBg variant="light" />
        <GlassVectors color="#16a34a" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-5xl mb-6"
            >
              🎓
            </motion.div>
            <h2 className="text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700 }}>
              {t('cta.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold shadow-xl hover:opacity-90 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--btc-primary,#16a34a)' }}
              >
                {t('cta.enrollNow')} <ArrowRight size={18} />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-gray-700 dark:text-gray-300 font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 transition-all"
              >
                {t('cta.browsePrograms')}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}