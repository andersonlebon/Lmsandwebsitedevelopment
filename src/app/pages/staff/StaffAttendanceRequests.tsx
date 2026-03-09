import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export function StaffAttendanceRequests() {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/attendance-requests/for-teacher', { requireAuth: true });
      setRequests(d.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected', rejectReason?: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/attendance-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectReason }),
        requireAuth: true,
      });
      load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
        {lang === 'fr' ? 'Demandes de présence' : 'Attendance requests'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {lang === 'fr' ? 'Approuvez ou rejetez les demandes de présence des étudiants.' : 'Approve or reject student attendance requests.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
          {lang === 'fr' ? 'Aucune demande en attente' : 'No pending requests'}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{lang === 'fr' ? 'Étudiant' : 'Student'} ID: {r.studentId?.slice(0, 8)}…</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang === 'fr' ? 'Classe' : 'Class'} ID: {r.classId?.slice(0, 8)}… · {r.requestDate} {r.requestedAt ? new Date(r.requestedAt).toLocaleTimeString() : ''}
                </p>
                {r.address && <p className="text-xs text-gray-500 mt-1">{r.address}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleReview(r.id, 'approved')} disabled={actionLoading === r.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                  {lang === 'fr' ? 'Approuver' : 'Approve'}
                </button>
                <button onClick={() => { const reason = window.prompt(lang === 'fr' ? 'Raison du rejet (optionnel)' : 'Reject reason (optional)'); handleReview(r.id, 'rejected', reason || undefined); }} disabled={actionLoading === r.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  {lang === 'fr' ? 'Rejeter' : 'Reject'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
