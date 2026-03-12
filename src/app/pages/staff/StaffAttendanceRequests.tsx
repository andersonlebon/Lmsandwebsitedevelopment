import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
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

  const approvalLink = (requestId: string, profileId: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/staff/approve-attendance?requestId=${requestId}&studentId=${profileId}` : '';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
        {lang === 'fr' ? 'Demandes de présence' : 'Attendance requests'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {lang === 'fr'
          ? 'Les étudiants soumettent leur présence et obtiennent un QR code contenant un lien. Quand vous ouvrez ce lien (en scannant le QR ou en cliquant ci‑dessous), la demande est approuvée automatiquement.'
          : 'Students submit attendance and get a QR code containing a link. When you open that link (by scanning the QR or clicking below), the request is approved automatically.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
          {lang === 'fr' ? 'Aucune demande de présence' : 'No attendance requests'}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const isPending = r.status === 'pending';
            return (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {(r.studentName ?? (r as { name?: string }).name)
                      ? (lang === 'fr' ? 'Étudiant' : 'Student') + ': ' + (r.studentName ?? (r as { name?: string }).name)
                      : (lang === 'fr' ? 'Étudiant' : 'Student') + ' ID: ' + (r.profileId ?? r.studentId)?.slice(0, 8) + '…'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'fr' ? 'Classe' : 'Class'} ID: {r.classId?.slice(0, 8)}… · {r.requestDate} {r.requestedAt ? new Date(r.requestedAt).toLocaleTimeString() : ''}
                    {r.status && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : r.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                        {r.status === 'approved' ? (lang === 'fr' ? 'Approuvé' : 'Approved') : r.status === 'rejected' ? (lang === 'fr' ? 'Rejeté' : 'Rejected') : (lang === 'fr' ? 'En attente' : 'Pending')}
                      </span>
                    )}
                  </p>
                  {r.address && <p className="text-xs text-gray-500 mt-1">{r.address}</p>}
                  {r.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 italic">
                      {lang === 'fr' ? 'Commentaire' : 'Comment'}: {r.comment}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isPending && (
                    <>
                      <a
                        href={approvalLink(r.id, r.profileId ?? r.studentId ?? '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700"
                      >
                        <ExternalLink size={14} />
                        {lang === 'fr' ? 'Ouvrir le lien d\'approbation' : 'Open approval link'}
                      </a>
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
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
