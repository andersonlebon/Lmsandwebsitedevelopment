import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Loader2, CheckCircle, XCircle, Clock, Calendar, X, Download, Users, FileText, Printer } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

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

type DetailStudent = {
  studentId: string;
  name: string;
  present: boolean;
  requestStatus: string | null;
  comment: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  address: string | null;
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

function printAttendanceDetails(
  a: AttendanceRow,
  students: DetailStudent[],
  lang: string,
  teacherName?: string | null,
  material?: string | null,
  preparedLesson?: string | null
) {
  const isFr = lang === 'fr';
  const statusLabel = a.status === 'approved' ? (isFr ? 'Approuvé' : 'Approved') : a.status === 'rejected' ? (isFr ? 'Rejeté' : 'Rejected') : (isFr ? 'En attente' : 'Pending');
  const studentRows = students.map(s => [
    s.name,
    s.present ? (isFr ? 'Présent' : 'Present') : (isFr ? 'Absent' : 'Absent'),
    s.comment ?? '—',
  ]);
  const teacher = teacherName ?? '—';
  const materialText = material ?? '—';
  const preparedText = preparedLesson ?? '—';
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
    <div><dt>${isFr ? 'Enseignant' : 'Teacher'}</dt><dd>${String(teacher).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</dd></div>
    <div><dt>${isFr ? 'Matériel utilisé' : 'Material used'}</dt><dd>${String(materialText).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</dd></div>
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
}

function exportAttendancePDF(
  a: AttendanceRow,
  students: DetailStudent[],
  lang: string,
  teacherName?: string | null,
  material?: string | null,
  preparedLesson?: string | null
) {
  const isFr = lang === 'fr';
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setTextColor(0, 0, 0);
  const title = isFr ? 'Détails de la présence' : 'Attendance details';
  doc.setFontSize(14);
  doc.text(title, 14, 12);
  doc.setFontSize(10);
  doc.text(`${isFr ? 'Date' : 'Date'}: ${a.attendanceDate}  |  ${isFr ? 'Classe' : 'Class'}: ${a.className || a.classId || '—'}  |  ${isFr ? 'Statut' : 'Status'}: ${a.status}  |  ${isFr ? 'Soumis' : 'Submitted'}: ${a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}`, 14, 18);
  const headers = [
    isFr ? 'Étudiant' : 'Student',
    isFr ? 'Présent/Absent' : 'Present/Absent',
    isFr ? 'Commentaire' : 'Comment',
  ];
  const body = students.map(s => [
    s.name,
    s.present ? (isFr ? 'Présent' : 'Present') : (isFr ? 'Absent' : 'Absent'),
    s.comment ?? '—',
  ]);
  autoTable(doc, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 8, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });
  const finalY = (doc as any).lastAutoTable?.finalY ?? 22;
  const footerY = finalY + 10;
  doc.setFontSize(10);
  doc.text(`${isFr ? 'Enseignant' : 'Teacher'}: ${teacherName ?? '—'}`, 14, footerY);
  doc.text(`${isFr ? 'Leçon assignée' : 'Lesson assigned'}: ${material ?? '—'}`, 14, footerY + 6);
  doc.text(`${isFr ? 'Leçon préparée' : 'Lesson prepared'}: ${preparedLesson ?? '—'}`, 14, footerY + 12);
  const fileName = `attendance-${a.attendanceDate}-${(a.className || a.classId || 'class').replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

export function StaffMyAttendanceList() {
  const { t, lang } = useLanguage();
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRow | null>(null);
  const [details, setDetails] = useState<{ students: DetailStudent[]; teacherName?: string | null; material?: string | null; preparedLesson?: string | null } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
          studentId: s.studentId ?? s.student_id ?? '',
          name: s.name ?? s.studentName ?? '—',
          present: s.present === true,
          requestStatus: s.requestStatus ?? s.request_status ?? null,
          comment: s.comment ?? null,
          requestedAt: s.requestedAt ?? s.requested_at ?? null,
          reviewedAt: s.reviewedAt ?? s.reviewed_at ?? null,
          rejectReason: s.rejectReason ?? s.reject_reason ?? null,
          address: s.address ?? null,
        }));
        setDetails({
          students,
          teacherName: d?.attendance?.teacherName ?? null,
          material: d?.attendance?.material ?? null,
          preparedLesson: d?.attendance?.preparedLesson ?? null,
        });
      })
      .catch(() => setDetails({ students: [], teacherName: null, material: null, preparedLesson: null }))
      .finally(() => setDetailsLoading(false));
  }, [selectedAttendance?.id]);

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
                  {lang === 'fr' ? 'Liste de présence des étudiants' : 'Student attendance list'}
                </h3>
                {(() => {
                  const names = selectedAttendance.presentStudentNames && selectedAttendance.presentStudentNames.length > 0
                    ? selectedAttendance.presentStudentNames
                    : (selectedAttendance.presentStudentIds || []).map(id => id?.slice(0, 8) || '—');
                  const displayStudents: DetailStudent[] = details && details.students.length > 0
                    ? details.students
                    : names.map((name, i) => ({
                        studentId: selectedAttendance.presentStudentIds?.[i] ?? `fallback-${i}`,
                        name: name || '—',
                        present: true,
                        requestStatus: null,
                        comment: null,
                        requestedAt: null,
                        reviewedAt: null,
                        rejectReason: null,
                        address: null,
                      }));
                  return (
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
                          {detailsLoading ? (
                            <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400"><Loader2 size={24} className="animate-spin inline-block" /></td></tr>
                          ) : displayStudents.length === 0 ? (
                            <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucun étudiant inscrit.' : 'No students enrolled.'}</td></tr>
                          ) : (
                            displayStudents.map((s) => (
                              <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 align-top">
                                <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                <td className="px-3 py-2.5 text-gray-900 dark:text-white">
                                  {s.present ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium"><CheckCircle size={14} /> {lang === 'fr' ? 'Présent' : 'Present'}</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium"><XCircle size={14} /> {lang === 'fr' ? 'Absent' : 'Absent'}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 max-w-[280px] break-words text-xs">{s.comment ?? '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0 space-y-3">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
              <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => exportAttendanceCSV(selectedAttendance)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Download size={18} />
                {lang === 'fr' ? 'Exporter (CSV)' : 'Export (CSV)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const names = selectedAttendance.presentStudentNames?.length ? selectedAttendance.presentStudentNames : (selectedAttendance.presentStudentIds || []).map(id => id?.slice(0, 8) || '—');
                  const list: DetailStudent[] = details?.students?.length ? details.students : names.map((name, i) => ({ studentId: selectedAttendance.presentStudentIds?.[i] ?? `fallback-${i}`, name: name || '—', present: true, requestStatus: null, comment: null, requestedAt: null, reviewedAt: null, rejectReason: null, address: null }));
                  exportAttendancePDF(selectedAttendance, list, lang, details?.teacherName, details?.material, details?.preparedLesson);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <FileText size={18} />
                {lang === 'fr' ? 'Exporter (PDF)' : 'Export (PDF)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const names = selectedAttendance.presentStudentNames?.length ? selectedAttendance.presentStudentNames : (selectedAttendance.presentStudentIds || []).map(id => id?.slice(0, 8) || '—');
                  const list: DetailStudent[] = details?.students?.length ? details.students : names.map((name, i) => ({ studentId: selectedAttendance.presentStudentIds?.[i] ?? `fallback-${i}`, name: name || '—', present: true, requestStatus: null, comment: null, requestedAt: null, reviewedAt: null, rejectReason: null, address: null }));
                  printAttendanceDetails(selectedAttendance, list, lang, details?.teacherName, details?.material, details?.preparedLesson);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Printer size={18} />
                {lang === 'fr' ? 'Imprimer' : 'Print'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedAttendance(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
