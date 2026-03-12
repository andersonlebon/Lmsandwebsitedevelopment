import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Loader2, CheckCircle, XCircle, Clock, Calendar, X, Download, Users } from 'lucide-react';
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

function exportAttendanceCSV(a: AttendanceRow) {
  const headers = ['Date', 'Class', 'Status', 'Submitted at', 'Student name'];
  const rows = (a.presentStudentNames && a.presentStudentNames.length > 0
    ? a.presentStudentNames
    : (a.presentStudentIds || []).map(() => '—')
  ).map((name, i) => [
    a.attendanceDate,
    a.className || a.classId || '',
    a.status,
    a.submittedAt ? new Date(a.submittedAt).toISOString() : '',
    name,
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-${a.attendanceDate}-${(a.className || a.classId || 'class').replace(/\s+/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function StaffMyAttendanceList() {
  const { t, lang } = useLanguage();
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRow | null>(null);

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
          ? 'Liste des présences que vous avez soumises pour paiement. Cliquez sur une ligne pour voir le détail et la liste des participants, ou exporter en CSV.'
          : 'List of attendances you submitted for payment. Click a row to view details and the list of participants, or export to CSV.'}
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
                      onClick={() => setSelectedAttendance(a)}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
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

      {selectedAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAttendance(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lang === 'fr' ? 'Détails de la présence' : 'Attendance details'}
              </h2>
              <button type="button" onClick={() => setSelectedAttendance(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-auto flex-1 min-h-0">
              <dl className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Date' : 'Date'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{selectedAttendance.attendanceDate}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Classe' : 'Class'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{selectedAttendance.className || selectedAttendance.classId || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Statut' : 'Status'}</dt>
                  <dd>
                    {(() => {
                      const b = statusBadge(selectedAttendance.status);
                      const Icon = b.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${b.className}`}>
                          <Icon size={12} /> {b.label}
                        </span>
                      );
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Soumis le' : 'Submitted'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {selectedAttendance.submittedAt ? new Date(selectedAttendance.submittedAt).toLocaleString() : '—'}
                  </dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <Users size={16} />
                  {lang === 'fr' ? 'Étudiants présents' : 'Students who participated'}
                </h3>
                <ul className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-auto">
                  {(selectedAttendance.presentStudentNames && selectedAttendance.presentStudentNames.length > 0
                    ? selectedAttendance.presentStudentNames
                    : (selectedAttendance.presentStudentIds || []).map(id => id?.slice(0, 8) || '—')
                  ).map((name, idx) => (
                    <li key={idx} className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">
                      {name || (lang === 'fr' ? '—' : '—')}
                    </li>
                  ))}
                  {(!selectedAttendance.presentStudentNames || selectedAttendance.presentStudentNames.length === 0) &&
                    (!selectedAttendance.presentStudentIds || selectedAttendance.presentStudentIds.length === 0) && (
                    <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                      {lang === 'fr' ? 'Aucun étudiant listé.' : 'No students listed.'}
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => exportAttendanceCSV(selectedAttendance)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Download size={18} />
                {lang === 'fr' ? 'Exporter la liste (CSV)' : 'Export list (CSV)'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedAttendance(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
