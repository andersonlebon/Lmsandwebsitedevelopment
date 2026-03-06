import { motion } from 'motion/react';
import { Link } from 'react-router';
import { BookOpen, Users, ClipboardCheck, Clock, ArrowRight, CheckCircle, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

const todayClasses: any[] = [];
const recentAttendance: any[] = [];

export function StaffDashboard() {
  const { t, lang } = useLanguage();
  const { user: authUser } = useAuth();
  const user = authUser || JSON.parse(localStorage.getItem('btc_user') || '{"name":"Staff"}');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Bonjour' : 'Good morning'}, {user.name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {lang === 'fr' ? "Voici un résumé de vos cours et activités." : "Here's a summary of your classes and activities."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('staff.todayClasses'), value: '0', icon: Calendar, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
          { label: t('staff.totalStudents'), value: '0', icon: Users, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
          { label: t('staff.classesThisWeek'), value: '0', icon: BookOpen, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
          { label: t('staff.avgAttendance'), value: '—', icon: ClipboardCheck, color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
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

      {/* Today's Classes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('staff.todayClasses')}</h3>
          <Link to="/staff/schedule" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--btc-primary,#2E8B57)' }}>
            {lang === 'fr' ? 'Voir tout' : 'View All'} <ArrowRight size={12} />
          </Link>
        </div>
        {todayClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p>{lang === 'fr' ? 'Aucun cours prévu aujourd\'hui.' : 'No classes scheduled today.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayClasses.map((cls: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="text-xs font-bold text-gray-500 w-16 shrink-0">{cls.time}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{cls.title}</p>
                  <p className="text-xs text-gray-500">{cls.room}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>
          {lang === 'fr' ? 'Actions rapides' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('staff.myClasses'), icon: BookOpen, href: '/staff/classes', color: '#2563eb' },
            { label: t('staff.attendance'), icon: ClipboardCheck, href: '/staff/attendance', color: '#16a34a' },
            { label: t('staff.materials'), icon: BookOpen, href: '/staff/materials', color: '#7c3aed' },
            { label: t('staff.schedule'), icon: Calendar, href: '/staff/schedule', color: '#ea580c' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${action.color}20` }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}