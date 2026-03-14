import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Loader2, Users, X, Printer } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

type DetailStudent = { studentId: string; name: string; present: boolean; comment: string | null };

export function LecturerAttendanceReview() {
  const { lang } = useLanguage();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<any | null>(null);
  const [details, setDetails] = useState<{ students: DetailStudent[]; teacherName?: string | null; material?: string | null; preparedLesson?: string | null } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedAttendance?.id) {
      setDetails(null);
      return;
    }
    setDetailsLoading(true);
    setDetails(null);
    apiFetch(`/lecturer-attendance/${selectedAttendance.id}/details`, { requireAuth: true })
      .then((d: any) => {
        const raw = Array.isArray(d?.students) ? d.students : [];
        const students: DetailStudent[] = raw.map((s: any) => ({
          studentId: s.studentId ?? '',
          name: s.name ?? '—',
          present: s.present === true,
          comment: s.comment ?? null,
        }));
        setDetails({
          students,
          teacherName: d?.attendance?.teacherName ?? null,
          material: d?.attendance?.material ?? null,
          preparedLesson: d?.attendance?.preparedLesson ?? null,
        });
      })
      .catch(() => setDetails(null))
      .finally(() => setDetailsLoading(false));
  }, [selectedAttendance?.id]);

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
      setSelectedAttendance(null);
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
      setSelectedAttendance(null);
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    if (!selectedAttendance || !details) return;
    const isFr = lang === 'fr';
    const a = selectedAttendance;
    const statusLabel = a.status === 'approved' ? (isFr ? 'Approuvé' : 'Approved') : a.status === 'rejected' ? (isFr ? 'Rejeté' : 'Rejected') : (isFr ? 'En attente' : 'Pending');
    const studentRows = details.students.map(s => [
      s.name,
      s.present ? (isFr ? 'Présent' : 'Present') : (isFr ? 'Absent' : 'Absent'),
      s.comment ?? '—',
    ]);
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${isFr ? 'Détails de la présence' : 'Attendance details'}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 1.25rem; margin-bottom: 8px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; font-size: 14px; }
  .meta dt { color: #666; } .meta dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  .footer-meta { margin-top: 16px; font-size: 14px; }
  .footer-meta dt { color: #666; }
</style>
</head>
<body>
  <h1>${isFr ? 'Détails de la présence' : 'Attendance details'}</h1>
  <dl class="meta">
    <div><dt>${isFr ? 'Date' : 'Date'}</dt><dd>${a.attendanceDate}</dd></div>
    <div><dt>${isFr ? 'Classe' : 'Class'}</dt><dd>${a.className || a.classId || '—'}</dd></div>
    <div><dt>${isFr ? 'Statut' : 'Status'}</dt><dd>${statusLabel}</dd></div>
    <div><dt>${isFr ? 'Soumis le' : 'Submitted'}</dt><dd>${a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</dd></div>
  </dl>
  <table>
    <thead><tr>
      <th>${isFr ? 'Étudiant' : 'Student'}</th>
      <th>${isFr ? 'Présent / Absent' : 'Present / Absent'}</th>
      <th>${isFr ? 'Commentaire' : 'Comment'}</th>
    </tr></thead>
    <tbody>
      ${studentRows.map(row => `<tr>${row.map(c => `<td>${String(c).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <dl class="footer-meta">
    <div><dt>${isFr ? 'Enseignant' : 'Teacher'}</dt><dd>${String(details.teacherName ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</dd></div>
    <div><dt>${isFr ? 'Leçon assignée' : 'Lesson assigned'}</dt><dd>${String(details.material ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</dd></div>
    <div><dt>${isFr ? 'Leçon préparée' : 'Lesson prepared by teacher'}</dt><dd>${String(details.preparedLesson ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</dd></div>
  </dl>
</body>
</html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
      win.addEventListener('afterprint', () => win.close());
    };
  };

  const isPending = selectedAttendance?.status === 'pending';

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Participants' : 'Participants'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {attendances.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">{lang === 'fr' ? 'Aucune entrée' : 'No entries'}</td></tr>
              ) : (
                attendances.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAttendance(a)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{staffMap[a.staffId] || a.staffId?.slice(0, 8)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{a.className || classMap[a.classId] || a.classId?.slice(0, 8)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{a.attendanceDate}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400 max-w-[200px]">
                      {Array.isArray(a.presentStudentNames) && a.presentStudentNames.length > 0 ? (
                        <span className="text-xs">{a.presentStudentNames.filter(Boolean).join(', ') || '—'}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        a.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        a.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {a.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleApprove(a.id)} disabled={actionLoading === a.id} className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading === a.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                            {lang === 'fr' ? 'Approuver' : 'Approve'}
                          </button>
                          <button onClick={() => handleReject(a.id)} disabled={actionLoading === a.id} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAttendance(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
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
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedAttendance.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      selectedAttendance.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                    }`}>
                      {selectedAttendance.status === 'approved' ? (lang === 'fr' ? 'Approuvé' : 'Approved') : selectedAttendance.status === 'rejected' ? (lang === 'fr' ? 'Rejeté' : 'Rejected') : (lang === 'fr' ? 'En attente' : 'Pending')}
                    </span>
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
                  {lang === 'fr' ? 'Liste de présence des étudiants' : 'Student attendance list'}
                </h3>
                {detailsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
                ) : details && details.students.length > 0 ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-x-auto bg-white dark:bg-gray-800">
                    <table className="w-full text-left text-sm min-w-[320px] text-gray-900 dark:text-gray-100">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-600">
                          <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Étudiant' : 'Student'}</th>
                          <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Présent / Absent' : 'Present / Absent'}</th>
                          <th className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Commentaire' : 'Comment'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.students.map((s) => (
                          <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{s.name}</td>
                            <td className="px-3 py-2.5">
                              {s.present ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium"><CheckCircle size={14} /> {lang === 'fr' ? 'Présent' : 'Present'}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium"><XCircle size={14} /> {lang === 'fr' ? 'Absent' : 'Absent'}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 max-w-[280px] break-words text-xs">{s.comment ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : details ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{lang === 'fr' ? 'Aucun étudiant inscrit.' : 'No students enrolled.'}</p>
                ) : null}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Enseignant' : 'Teacher'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{details?.teacherName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Leçon assignée' : 'Lesson assigned'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{details?.material ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Leçon préparée par l\'enseignant' : 'Lesson prepared by teacher'}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{details?.preparedLesson ?? '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 shrink-0">
              <button type="button" onClick={handlePrint} disabled={detailsLoading || !details} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">
                <Printer size={18} />
                {lang === 'fr' ? 'Imprimer' : 'Print'}
              </button>
              {isPending && (
                <>
                  <button type="button" onClick={() => handleApprove(selectedAttendance.id)} disabled={actionLoading === selectedAttendance.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {actionLoading === selectedAttendance.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {lang === 'fr' ? 'Approuver' : 'Approve'}
                  </button>
                  <button type="button" onClick={() => handleReject(selectedAttendance.id)} disabled={actionLoading === selectedAttendance.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    <XCircle size={18} />
                    {lang === 'fr' ? 'Rejeter' : 'Reject'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setSelectedAttendance(null)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
