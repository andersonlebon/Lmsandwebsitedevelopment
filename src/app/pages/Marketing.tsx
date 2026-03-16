import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  CreditCard, 
  Brain, 
  Briefcase,
  LineChart,
  MessageSquare,
  FileText,
  Clock,
  Globe,
  Zap,
  Shield,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function Marketing() {
  const { t, lang } = useLanguage();
  const { colorMode } = useTheme();
  
  // Force English for marketing page
  const marketingLang = 'en';
  
  const features = [
    {
      icon: Users,
      key: 'students',
      title: 'Student Management',
      desc: 'Complete enrollment, profiles & tracking',
      position: { x: -35, y: -20 },
      color: '#2E8B57'
    },
    {
      icon: BookOpen,
      key: 'courses',
      title: 'Course Management',
      desc: 'Multi-department programs & materials',
      position: { x: -15, y: -35 },
      color: '#00ACC1'
    },
    {
      icon: Calendar,
      key: 'attendance',
      title: 'Smart Attendance',
      desc: 'Real-time tracking & analytics',
      position: { x: 15, y: -35 },
      color: '#66CDAA'
    },
    {
      icon: Award,
      key: 'certificates',
      title: 'Digital Certificates',
      desc: 'Auto-generation & verification',
      position: { x: 35, y: -20 },
      color: '#80DEEA'
    },
    {
      icon: CreditCard,
      key: 'payments',
      title: 'Payment System',
      desc: 'Mobile money & multi-currency',
      position: { x: 40, y: 0 },
      color: '#2E8B57'
    },
    {
      icon: Brain,
      key: 'ai',
      title: 'AI Assistant',
      desc: 'Intelligent tutoring & support',
      position: { x: 35, y: 20 },
      color: '#00ACC1'
    },
    {
      icon: Briefcase,
      key: 'jobs',
      title: 'Job Board',
      desc: 'Career placement & opportunities',
      position: { x: 15, y: 35 },
      color: '#66CDAA'
    },
    {
      icon: LineChart,
      key: 'analytics',
      title: 'Advanced Analytics',
      desc: 'Reports, insights & forecasting',
      position: { x: -15, y: 35 },
      color: '#80DEEA'
    },
    {
      icon: MessageSquare,
      key: 'community',
      title: 'Community Hub',
      desc: 'Forums, discussions & networking',
      position: { x: -35, y: 20 },
      color: '#2E8B57'
    },
    {
      icon: FileText,
      key: 'resources',
      title: 'Resource Library',
      desc: 'Digital materials & downloads',
      position: { x: -40, y: 0 },
      color: '#00ACC1'
    },
    {
      icon: Clock,
      key: 'schedule',
      title: 'Smart Scheduling',
      desc: 'Automated timetables & reminders',
      position: { x: 0, y: -42 },
      color: '#66CDAA'
    },
    {
      icon: Shield,
      key: 'security',
      title: 'Role-Based Access',
      desc: 'Admin, Staff & Student portals',
      position: { x: 0, y: 42 },
      color: '#80DEEA'
    }
  ];

  const centerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(centerRef, { once: false, amount: 0.3 });

  return (
    <div className="py-30 w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative flex items-center justify-center">
      {/* Animated Background Vectors */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2E8B57', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#00ACC1', stopOpacity: 0.2 }} />
          </linearGradient>
          <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#66CDAA', stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: '#80DEEA', stopOpacity: 0.15 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Animated circles */}
        <motion.circle
          cx="10%" cy="15%" r="150"
          fill="url(#grad1)"
          animate={{ 
            cx: ["10%", "15%", "10%"],
            cy: ["15%", "20%", "15%"],
            r: [150, 180, 150]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="90%" cy="80%" r="200"
          fill="url(#grad2)"
          animate={{ 
            cx: ["90%", "85%", "90%"],
            cy: ["80%", "75%", "80%"],
            r: [200, 230, 200]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="20%" cy="85%" r="120"
          fill="url(#grad1)"
          animate={{ 
            cx: ["20%", "25%", "20%"],
            cy: ["85%", "80%", "85%"],
            r: [120, 150, 120]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="80%" cy="20%" r="180"
          fill="url(#grad2)"
          animate={{ 
            cx: ["80%", "75%", "80%"],
            cy: ["20%", "25%", "20%"],
            r: [180, 210, 180]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated polygons */}
        <motion.polygon
          points="50,10 90,90 10,90"
          fill="none"
          stroke="url(#grad1)"
          strokeWidth="2"
          opacity="0.3"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50% 60%" }}
        />
        <motion.polygon
          points="1800,100 1900,300 1700,300"
          fill="none"
          stroke="url(#grad2)"
          strokeWidth="2"
          opacity="0.3"
          animate={{ 
            rotate: [360, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "1800px 200px" }}
        />
      </svg>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-10 left-10 w-24 h-24 border-4 border-cyan-500/30 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-32 h-32 border-4 border-emerald-500/30 rotate-45"
        animate={{ 
          y: [0, 20, 0],
          rotate: [45, 225, 45],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-5 w-20 h-20 border-4 border-teal-400/30 rounded-lg"
        animate={{ 
          x: [0, 15, 0],
          rotate: [0, -90, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] w-full px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full blur-2xl opacity-50"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative bg-gradient-to-br from-emerald-600 to-cyan-500 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl">
                <GraduationCap className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent leading-tight"
          >
            BTC LMS
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Ready to Go Online
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              The Complete Learning Management System for Brotherly Training Center — Goma, DRC
            </p>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-3 justify-center items-center"
          >
            {[
              { icon: Globe, text: 'Bilingual EN/FR' },
              { icon: Shield, text: 'Role-Based Auth' },
              { icon: Zap, text: '40+ API Routes' },
              { icon: Sparkles, text: '13 Database Tables' },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center gap-2"
              >
                <badge.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Features Constellation */}
        <div ref={centerRef} className="relative w-full max-w-5xl mx-auto h-[700px] flex items-center justify-center">
          {/* Center Hub */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute z-20"
          >
            <div className="relative">
              {/* Pulsing rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                  animate={{
                    scale: [1, 2.5, 2.5],
                    opacity: [0.6, 0, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "easeOut"
                  }}
                  style={{ transformOrigin: 'center' }}
                />
              ))}
              
              {/* Center circle */}
              <motion.div
                className="relative bg-gradient-to-br from-emerald-600 via-cyan-600 to-teal-600 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20"
                animate={{ 
                  rotate: [0, 360],
                  boxShadow: [
                    '0 0 40px rgba(0, 172, 193, 0.5)',
                    '0 0 60px rgba(46, 139, 87, 0.7)',
                    '0 0 40px rgba(0, 172, 193, 0.5)',
                  ]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                <div className="text-center">
                  <GraduationCap className="w-12 h-12 text-white mx-auto mb-1" strokeWidth={2.5} />
                  <div className="text-xs font-bold text-white">BTC</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Feature Nodes */}
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const angle = (index / features.length) * Math.PI * 2;
            const radius = 280;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <React.Fragment key={feature.key}>
                {/* Connection Line */}
                <motion.svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                >
                  <motion.line
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x}px)`}
                    y2={`calc(50% + ${y}px)`}
                    stroke={feature.color}
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { 
                      pathLength: 1, 
                      opacity: 0.4,
                      strokeDashoffset: [0, -20]
                    } : {}}
                    transition={{ 
                      pathLength: { duration: 1, delay: 0.8 + index * 0.05 },
                      opacity: { duration: 0.5, delay: 0.8 + index * 0.05 },
                      strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" }
                    }}
                    filter="url(#glow)"
                  />
                </motion.svg>

                {/* Feature Card */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.8 + index * 0.08,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.15, 
                    zIndex: 30,
                    transition: { duration: 0.2 }
                  }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative">
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                      style={{ backgroundColor: feature.color }}
                    />
                    
                    {/* Card */}
                    <div className="relative bg-slate-900/90 backdrop-blur-md border-2 rounded-2xl p-4 w-48 shadow-xl group-hover:border-opacity-100 transition-all duration-300"
                      style={{ borderColor: feature.color + '40' }}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg"
                        style={{ 
                          backgroundColor: feature.color + '20',
                          boxShadow: `0 0 20px ${feature.color}30`
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-white font-bold text-sm text-center mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 text-xs text-center leading-tight">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { 
              number: '4', 
              label: 'Departments',
              sublabel: 'Languages & Vocational'
            },
            { 
              number: '13', 
              label: 'Database Tables',
              sublabel: 'Full Schema + RLS'
            },
            { 
              number: '3', 
              label: 'User Roles',
              sublabel: 'Admin, Staff, Student'
            },
            { 
              number: '40+', 
              label: 'API Routes',
              sublabel: 'Supabase Backend'
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.2 + i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
              <div className="text-slate-400 text-xs">{stat.sublabel}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 text-lg font-medium">
            Powering education in Goma, DRC with modern technology
          </p>
        </motion.div>
      </div>

      {/* Ambient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none" />
    </div>
  );
}