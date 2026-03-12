import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Loader2, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

type AttendanceRow = {
  id: string;
  classId: string;
  className?: string;
  attendanceDate: string;
  status: string;
  submittedAt: string | null;
  presentStudentIds?: string[];
  presentStudentNames?: string[];
};

export function StaffMyAttendanceList() {
  const { t, lang } = useLanguage();
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const url = `/lecturer-attendance${params.toString() ? '?' + params.toString() : ''}`;
      const d = await apiFetch(url, { requireAuth: true });
      setAttendances(d.attendances || []);
    } catch {
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateFrom, dateTo]);

  const statusBadge = (status: string) => {
    if (status === 'approved') return { icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900/30', label: lang === 'fr' ? 'Approuvé' : 'Approved' };
    if (status === 'rejected') return { icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30', label: lang === 'fr' ? 'Rejeté' : 'Rejected' };
    return { icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30', label: lang === 'fr' ? 'En attente' : 'Pending' };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
        {t('staff.myAttendance')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {lang === 'fr'
          ? 'Liste des présences que vous avez soumises pour paiement. Filtrez par date pour retrouver une session.'
          : 'List of attendances you submitted for payment. Filter by date to find a session.'}
      </p>

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('staff.filterByDate')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('staff.from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('staff.to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : attendances.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 flex flex-col items-center gap-2">
          <ClipboardList size={48} className="opacity-40" />
          <p>{lang === 'fr' ? 'Aucune présence soumise pour cette période.' : 'No submitted attendance for this period.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{lang === 'fr' ? 'Date' : 'Date'}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{lang === 'fr' ? 'Classe' : 'Class'}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{lang === 'fr' ? 'Présents' : 'Present'}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{lang === 'fr' ? 'Soumis le' : 'Submitted'}</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a, i) => {
                  const badge = statusBadge(a.status);
                  const Icon = badge.icon;
                  const presentCount = Array.isArray(a.presentStudentIds) ? a.presentStudentIds.length : 0;
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{a.attendanceDate}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{a.className || a.classId?.slice(0, 8) || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{presentCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${badge.className}`}>
                          <Icon size={12} /> {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
