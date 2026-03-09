import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export function LecturerAttendanceReview() {
  const { lang } = useLanguage();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const [attRes, staffRes, classRes] = await Promise.all([
        apiFetch(`/lecturer-attendance${statusFilter ? `?status=${statusFilter}` : ''}`, { requireAuth: true }),
        apiFetch('/staff', { requireAuth: true }),
        apiFetch('/classes', { requireAuth: true }),
      ]);
      setAttendances(attRes.attendances || []);
      const s: Record<string, string> = {};
      (staffRes.staff || []).forEach((st: any) => { s[st.id] = st.name || st.email; });
      setStaffMap(s);
      const c: Record<string, string> = {};
      (classRes.classes || []).forEach((cl: any) => { c[cl.id] = cl.name; });
      setClassMap(c);
    } catch {
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/lecturer-attendance/${id}/approve`, { method: 'PATCH', requireAuth: true });
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt(lang === 'fr' ? 'Raison du rejet (optionnel)' : 'Reject reason (optional)');
    setActionLoading(id);
    try {
      await apiFetch(`/lecturer-attendance/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ rejectReason: reason || undefined }), requireAuth: true });
      load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Présences enseignants' : 'Lecturer attendance'}
        </h1>
        <div className="flex gap-1">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-medium ${statusFilter === s ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'}`}
              style={statusFilter === s ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
            >
              {s === 'pending' ? (lang === 'fr' ? 'En attente' : 'Pending') : s === 'approved' ? (lang === 'fr' ? 'Approuvées' : 'Approved') : (lang === 'fr' ? 'Rejetées' : 'Rejected')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Enseignant' : 'Lecturer'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Classe' : 'Class'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Date' : 'Date'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                {statusFilter === 'pending' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Actions' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {attendances.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{lang === 'fr' ? 'Aucune entrée' : 'No entries'}</td></tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{staffMap[a.staffId] || a.staffId?.slice(0, 8)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{classMap[a.classId] || a.classId?.slice(0, 8)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{a.attendanceDate}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        a.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        a.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    {statusFilter === 'pending' && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleApprove(a.id)} disabled={actionLoading === a.id} className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading === a.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                            {lang === 'fr' ? 'Approuver' : 'Approve'}
                          </button>
                          <button onClick={() => handleReject(a.id)} disabled={actionLoading === a.id} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
