import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen, Download, Calendar, ClipboardCheck } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';

const enrollmentByMonth: any[] = [];

const revenueData: any[] = [];

const deptDistribution = [
  { name: 'English', value: 0, color: '#16a34a' },
  { name: 'Computer', value: 0, color: '#2563eb' },
  { name: 'Driving', value: 0, color: '#ea580c' },
  { name: 'Sewing', value: 0, color: '#d946ef' },
];

const attendanceByDept = [
  { dept: 'English', rate: 0 },
  { dept: 'Computer', rate: 0 },
  { dept: 'Driving', rate: 0 },
  { dept: 'Sewing', rate: 0 },
];

export function Reports() {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('reports.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('reports.subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
          <Download size={16} /> {t('common.export')}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Étudiants' : 'Total Students', value: '0', icon: Users, color: '#2563eb', change: '—' },
          { label: lang === 'fr' ? 'Revenu Total' : 'Total Revenue', value: '$0', icon: DollarSign, color: '#16a34a', change: '—' },
          { label: lang === 'fr' ? 'Taux de Présence' : 'Attendance Rate', value: '0%', icon: ClipboardCheck, color: '#7c3aed', change: '—' },
          { label: lang === 'fr' ? 'Cours Actifs' : 'Active Courses', value: '0', icon: BookOpen, color: '#ea580c', change: '—' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            <TrendingUp size={16} style={{ color: 'var(--btc-primary,#2E8B57)' }} /> {t('reports.enrollment')}
          </h3>
          <p className="text-xs text-gray-400 mb-4">{lang === 'fr' ? 'Inscriptions par département' : 'Enrollment by department'}</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={enrollmentByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="english" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="computer" stackId="a" fill="#2563eb" />
              <Bar dataKey="driving" stackId="a" fill="#ea580c" />
              <Bar dataKey="sewing" stackId="a" fill="#d946ef" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            <DollarSign size={16} style={{ color: 'var(--btc-primary,#2E8B57)' }} /> {t('reports.revenue')}
          </h3>
          <p className="text-xs text-gray-400 mb-4">{lang === 'fr' ? 'Revenus vs Dépenses' : 'Revenue vs Expenses'}</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            <Users size={16} style={{ color: 'var(--btc-primary,#2E8B57)' }} /> {lang === 'fr' ? 'Répartition par Département' : 'Department Distribution'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                {deptDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attendance report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            <ClipboardCheck size={16} style={{ color: 'var(--btc-primary,#2E8B57)' }} /> {t('reports.attendance')}
          </h3>
          <div className="space-y-4">
            {attendanceByDept.map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.dept}</span>
                  <span className="text-sm font-bold" style={{ color: deptDistribution[i]?.color }}>{d.rate}%</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.rate}%` }} transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                    className="h-full rounded-full" style={{ background: deptDistribution[i]?.color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}