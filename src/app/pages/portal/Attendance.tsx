import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const attendanceData: any[] = [];

const months: any[] = [];

export function PortalAttendance() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');

  const totalPresent = attendanceData.filter(a => a.status === 'present').length;
  const totalAbsent = attendanceData.filter(a => a.status === 'absent').length;
  const totalLate = attendanceData.filter(a => a.status === 'late').length;
  const rate = attendanceData.length > 0 ? Math.round((totalPresent / attendanceData.length) * 100) : 0;

  const statusIcon = (status: string) => {
    if (status === 'present') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'absent') return <XCircle size={16} className="text-red-500" />;
    return <AlertTriangle size={16} className="text-yellow-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'present') return t('att.present');
    if (status === 'absent') return t('att.absent');
    return t('att.late');
  };

  const statusBg = (status: string) => {
    if (status === 'present') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    if (status === 'absent') return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
  };

  const filtered = filter === 'all' ? attendanceData : attendanceData.filter(a => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('att.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('att.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('att.rate'), value: `${rate}%`, icon: TrendingUp, color: '#16a34a' },
          { label: t('att.present'), value: totalPresent, icon: CheckCircle, color: '#16a34a' },
          { label: t('att.absent'), value: totalAbsent, icon: XCircle, color: '#ef4444' },
          { label: t('att.late'), value: totalLate, icon: Clock, color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Attendance Rate Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 size={15} /> {lang === 'fr' ? 'Résumé Mensuel' : 'Monthly Summary'}</h3>
        </div>
        <div className="space-y-3">
          {months.map((m, i) => {
            const total = m.present + m.absent + m.late;
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-10">{m.name}</span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${(m.present / total) * 100}%` }} />
                  <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(m.late / total) * 100}%` }} />
                  <div className="bg-red-400 h-full transition-all" style={{ width: `${(m.absent / total) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{Math.round((m.present / total) * 100)}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500" /> {t('att.present')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-400" /> {t('att.late')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400" /> {t('att.absent')}</span>
        </div>
      </div>

      {/* Detailed list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-gray-900 dark:text-white flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            <Calendar size={16} /> {lang === 'fr' ? 'Historique Détaillé' : 'Detailed History'}
          </h3>
          <div className="flex gap-1">
            {['all', 'present', 'absent', 'late'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                style={filter === f ? { background: 'var(--btc-primary,#2E8B57)' } : {}}>
                {f === 'all' ? (lang === 'fr' ? 'Tout' : 'All') : statusLabel(f)}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                {statusIcon(a.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.course}</p>
                  <p className="text-xs text-gray-400">{a.date} · {a.time}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusBg(a.status)}`}>{statusLabel(a.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}