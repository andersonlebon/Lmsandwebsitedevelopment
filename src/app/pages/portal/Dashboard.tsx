import { motion } from 'motion/react';
import { Link } from 'react-router';
import { BookOpen, Clock, Award, TrendingUp, Play, Calendar, Bell, ArrowRight, Users } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

const progressData: any[] = [];
const myCourses: any[] = [];
const upcomingClasses: any[] = [];
const notifications: any[] = [];

export function PortalDashboard() {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const user = authUser || JSON.parse(localStorage.getItem('btc_user') || '{"name":"Student"}');

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {t('portalDash.welcomeBack')}, {user.name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('portalDash.continueLearning')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('portalDash.enrolledCourses'), value: '0', icon: BookOpen, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
          { label: t('portalDash.hoursThisWeek'), value: '0', icon: Clock, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
          { label: t('portalDash.certificates'), value: '0', icon: Award, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
          { label: t('portalDash.avgScore'), value: '—', icon: TrendingUp, color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5" style={{ fontFamily: 'Poppins' }}>{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Continue Learning + Study Chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('portalDash.continueLearningTitle')}</h3>
            <Link to="/portal/courses" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--btc-primary,#16a34a)' }}>
              {t('portalDash.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>
          {myCourses.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 text-center">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No courses enrolled yet.</p>
              <Link to="/register" className="text-sm font-medium mt-2 inline-block" style={{ color: 'var(--btc-primary,#16a34a)' }}>
                Browse Programs →
              </Link>
            </div>
          )}
          {myCourses.map((course: any, i: number) => (
            <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${course.color}20` }}>
                  <BookOpen size={22} style={{ color: course.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-sm">{course.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{course.instructor}</p>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: course.color, width: `${course.progress}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Study Hours Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>{t('portalDash.studyHours')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('portalDash.thisWeek')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--btc-primary,#16a34a)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--btc-primary,#16a34a)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`${v}h`, 'Hours']} />
              <Area type="monotone" dataKey="hours" stroke="var(--btc-primary,#16a34a)" fill="url(#studyGrad)" strokeWidth={2} id="area-study-hours" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('portalDash.total')}</span>
            <span className="font-bold" style={{ color: 'var(--btc-primary,#16a34a)', fontFamily: 'Poppins' }}>0 {t('common.hours')}</span>
          </div>
        </motion.div>
      </div>

      {/* Schedule + Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('portalDash.todaySchedule')}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString()}</span>
          </div>
          {upcomingClasses.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Calendar size={28} className="mx-auto mb-2 opacity-50" />
              <p>No classes scheduled today.</p>
            </div>
          )}
          {upcomingClasses.map((cls: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 w-16 shrink-0">{cls.time}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{cls.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cls.room}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('portalDash.notifications')}</h3>
            <Bell size={16} className="text-gray-400" />
          </div>
          {notifications.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Bell size={28} className="mx-auto mb-2 opacity-50" />
              <p>No notifications.</p>
            </div>
          )}
          {notifications.map((n: any, i: number) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
              n.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
              : n.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
              : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                n.type === 'warning' ? 'bg-yellow-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
              }`} />
              <p className="text-sm text-gray-700 dark:text-gray-300">{n.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
