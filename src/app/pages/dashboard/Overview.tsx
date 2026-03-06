import { motion } from 'motion/react';
import { Users, BookOpen, DollarSign, UserCog, TrendingUp, TrendingDown, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useStats } from '../../hooks/useBTC';

function StatCard({ stat, index }: { stat: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
          <stat.icon size={22} style={{ color: stat.color }} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.up ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
          {stat.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {stat.change}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins' }}>{stat.value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
    </motion.div>
  );
}

export function Overview() {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const user = authUser || { name: 'Admin' };

  const { stats, isLoading: loadingStats, error: statsError } = useStats();

  const dynamicStatsCards = [
    { label: t('dash.totalStudents'), value: stats ? String(stats.totalStudents) : '0', change: '—', up: true, icon: Users, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    { label: t('dash.activeCourses'), value: stats ? String(stats.totalCourses) : '0', change: '—', up: true, icon: BookOpen, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    { label: t('dash.monthlyRevenue'), value: stats ? `$${stats.totalRevenue}` : '$0', change: '—', up: true, icon: DollarSign, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { label: t('dash.staffMembers'), value: stats ? String(stats.totalStaff) : '0', change: '—', up: true, icon: UserCog, color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
  ];

  const recentStudents: any[] = stats?.recentStudents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {t('dash.goodMorning')}, {user.name || 'Admin'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dash.whatsHappening')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl">
          <Clock size={14} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStatsCards.map((stat, i) => <StatCard key={i} stat={stat} index={i} />)}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('dash.revenueExpenses')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('dash.last8Months')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            {loadingStats ? <Loader2 size={24} className="animate-spin" /> : (
              stats && stats.totalRevenue > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{ month: 'Total', revenue: stats.totalRevenue }]} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="var(--btc-primary,#16a34a)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>No data yet. Revenue will appear as payments are recorded.</p>
              )
            )}
          </div>
        </motion.div>

        {/* Student Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>{t('dash.studentsByProgram')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('dash.distribution')}</p>
          <div className="flex items-center justify-center h-44 text-gray-400 text-sm">
            {loadingStats ? <Loader2 size={24} className="animate-spin" /> : (
              <p>{stats && stats.totalStudents > 0 ? `${stats.totalStudents} total students` : 'No students enrolled yet.'}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Enrollments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('dash.recentEnrollments')}</h3>
          <Link to="/dashboard/students" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--btc-primary,#16a34a)' }}>
            {t('dash.viewAll')} <ArrowRight size={12} />
          </Link>
        </div>
        {loadingStats ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : recentStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p>No recent enrollments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pb-3 hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s: any, i: number) => (
                  <tr key={s.id || i} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                          {(s.name || '?').charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{s.email}</td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>{t('dash.quickActions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('dash.addStudent'), icon: Users, href: '/dashboard/students', color: '#16a34a' },
            { label: t('dash.addStaff'), icon: UserCog, href: '/dashboard/staff', color: '#2563eb' },
            { label: t('dash.newCourse'), icon: BookOpen, href: '/dashboard/online-studies', color: '#7c3aed' },
            { label: t('dash.viewFinance'), icon: DollarSign, href: '/dashboard/financing', color: '#ea580c' },
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
