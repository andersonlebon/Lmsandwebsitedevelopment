import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Loader2, CheckCircle, Clock, Filter } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

interface Enrollment {
  id: string;
  studentId: string;
  programId: string;
  promotionId: string;
  status: string;
  enrolledAt: string;
  studentName?: string;
  studentEmail?: string;
  progName?: string;
  progNameFr?: string;
  promoName?: string;
  promoNameFr?: string;
  startDate?: string;
  endDate?: string;
  totalAmountToPay: number;
}

const STATUS_LABELS: Record<string, { en: string; fr: string }> = {
  pending: { en: 'Pending approval', fr: 'En attente' },
  active: { en: 'Active', fr: 'Actif' },
  completed: { en: 'Completed', fr: 'Terminé' },
  dropped: { en: 'Dropped', fr: 'Abandonné' },
  suspended: { en: 'Suspended', fr: 'Suspendu' },
};

export function Enrollments() {
  const { lang } = useLanguage();
  const [list, setList] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/enrollments?status=${encodeURIComponent(statusFilter)}` : '/enrollments';
      const data = await apiFetch(url, { requireAuth: true });
      setList(data.enrollments || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setApprovingId(id);
    setError('');
    try {
      await apiFetch(`/enrollments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
        requireAuth: true,
      });
      setList(prev => prev.map(e => e.id === id ? { ...e, status: 'active' } : e));
    } catch (e: any) {
      setError(e.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Inscriptions' : 'Enrollments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr' ? 'Approuvez les inscriptions lorsque l’étudiant a payé.' : 'Approve enrollments when the student has paid.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="pending">{lang === 'fr' ? 'En attente' : 'Pending'}</option>
            <option value="active">{lang === 'fr' ? 'Actifs' : 'Active'}</option>
            <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
            <option value="completed">{lang === 'fr' ? 'Terminés' : 'Completed'}</option>
            <option value="dropped">{lang === 'fr' ? 'Abandonnés' : 'Dropped'}</option>
            <option value="suspended">{lang === 'fr' ? 'Suspendus' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          {statusFilter === 'pending'
            ? (lang === 'fr' ? 'Aucune inscription en attente.' : 'No pending enrollments.')
            : (lang === 'fr' ? 'Aucune inscription.' : 'No enrollments.')}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <motion.div
              key={e.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30 shrink-0">
                  <UserCheck size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {e.studentName || e.studentEmail || e.studentId}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {e.studentEmail}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {lang === 'fr' ? (e.progNameFr || e.progName) : e.progName} · {lang === 'fr' ? (e.promoNameFr || e.promoName) : e.promoName}
                    {' · '}{formatDate(e.startDate)} → {formatDate(e.endDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Total à payer' : 'Total to pay'}: <strong>${e.totalAmountToPay}</strong>
                    {' · '}{formatDate(e.enrolledAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  e.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                  e.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  e.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {STATUS_LABELS[e.status]?.[lang === 'fr' ? 'fr' : 'en'] || e.status}
                </span>
                {e.status === 'pending' && (
                  <button
                    onClick={() => approve(e.id)}
                    disabled={approvingId === e.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {approvingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {lang === 'fr' ? 'Approuver' : 'Approve'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
