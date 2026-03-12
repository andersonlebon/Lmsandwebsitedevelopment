import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Clock, QrCode, Users, Send, Loader2, ChevronLeft, ChevronRight, Wallet, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

interface ScheduleSlot {
  id: string;
  classId: string;
  className: string;
  classCode?: string;
  programName?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  lessonTitle?: string;
}

interface SessionStudent {
  enrollmentId: string;
  studentId: string;
  name: string;
  email?: string;
  requestId?: string;
  requestStatus?: string | null;
  comment?: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_MINUTES = 30;

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseTime(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toLocalYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return toLocalYYYYMMDD(mon);
}
function addWeeksToWeekStart(weekStart: string, delta: number): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + delta * 7);
  return toLocalYYYYMMDD(d);
}

export function StaffAttendance() {
  const { t, lang } = useLanguage();
  const [weekStart, setWeekStart] = useState(getMondayOfCurrentWeek);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(toYYYYMMDD(new Date()));
  const [session, setSession] = useState<{ classId: string; attendanceDate: string; scheduleId?: string; students: SessionStudent[]; notAssigned?: boolean } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({}); // studentId -> 'present' | 'late' | 'absent'
  const [submitToAdminLoading, setSubmitToAdminLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [qrPaste, setQrPaste] = useState('');
  const [qrError, setQrError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [submissionStatusByKey, setSubmissionStatusByKey] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    apiFetch(`/staff/my-schedule/week?weekStart=${weekStart}`, { requireAuth: true })
      .then((d: any) => {
        if (!cancelled) setSlots((d.slots || []).map((s: any) => ({ ...s, id: s.id || `${s.classId}-${s.dayOfWeek}-${s.startTime}` })));
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => { cancelled = true; };
  }, [weekStart]);

  const weekDates = DAY_LABELS.map((_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return toLocalYYYYMMDD(d);
  });

  useEffect(() => {
    let cancelled = false;
    const endD = new Date(weekStart + 'T12:00:00');
    endD.setDate(endD.getDate() + 6);
    const dateTo = toLocalYYYYMMDD(endD);
    apiFetch(`/lecturer-attendance?dateFrom=${weekStart}&dateTo=${dateTo}`, { requireAuth: true })
      .then((d: any) => {
        if (cancelled) return;
        const byKey: Record<string, 'pending' | 'approved' | 'rejected'> = {};
        (d.attendances || []).forEach((a: { classId: string; attendanceDate: string; status: string }) => {
          if (a.classId && a.attendanceDate && (a.status === 'pending' || a.status === 'approved' || a.status === 'rejected')) {
            byKey[`${a.classId}-${a.attendanceDate}`] = a.status as 'pending' | 'approved' | 'rejected';
          }
        });
        setSubmissionStatusByKey(byKey);
      })
      .catch(() => {
        if (!cancelled) setSubmissionStatusByKey({});
      });
    return () => { cancelled = true; };
  }, [weekStart]);

  const openSession = (slot: ScheduleSlot, date: string) => {
    setSelectedSlot(slot);
    setAttendanceDate(date);
    setSession(null);
    setAttendance({});
    setSessionLoading(true);
    apiFetch(`/staff/attendance/session?classId=${slot.classId}&attendanceDate=${date}`, { requireAuth: true })
      .then((d: any) => {
        setSession({ classId: d.classId, attendanceDate: d.attendanceDate, scheduleId: d.scheduleId, students: d.students || [], notAssigned: d.notAssigned });
        const initial: Record<string, string> = {};
        (d.students || []).forEach((s: SessionStudent) => {
          if (s.requestStatus === 'approved') initial[s.studentId] = 'present';
          else if (s.requestStatus === 'rejected') initial[s.studentId] = 'absent';
          else if (s.requestStatus === 'pending') initial[s.studentId] = ''; // leave unset or could default present
        });
        setAttendance(initial);
      })
      .catch(() => setSession({ classId: slot.classId, attendanceDate: date, scheduleId: undefined, students: [], notAssigned: true }))
      .finally(() => setSessionLoading(false));
  };

  const mark = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!session) return;
    const all: Record<string, string> = {};
    session.students.forEach(s => { all[s.studentId] = 'present'; });
    setAttendance(all);
  };

  const handleScanFromPaste = async () => {
    setQrError('');
    setScanSuccess(false);
    const trimmed = (qrPaste || '').trim();
    try {
      // If pasted value is the approval link (same action as opening the link or clicking Approve)
      const approvalMatch = trimmed.match(/approve-attendance\?[^#]*requestId=([^&\s]+)(?:&studentId=([^&\s]*))?/i) || trimmed.match(/requestId=([^&\s]+)/i);
      const requestIdFromUrl = approvalMatch?.[1];
      if (requestIdFromUrl) {
        await apiFetch(`/attendance-requests/${requestIdFromUrl}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          requireAuth: true,
        });
        setScanSuccess(true);
        setQrPaste('');
        const studentIdFromUrl = approvalMatch?.[2];
        if (session && studentIdFromUrl && session.classId && session.attendanceDate) {
          setAttendance(prev => ({ ...prev, [studentIdFromUrl]: 'present' }));
          setSession(prev => prev ? {
            ...prev,
            students: prev.students.map(s => s.studentId === studentIdFromUrl ? { ...s, requestStatus: 'approved' } : s),
          } : null);
        }
        return;
      }
      const payload = JSON.parse(trimmed);
      const { requestId: requestIdFromPayload, studentId, enrollmentId, classId, requestDate } = payload;
      if (requestIdFromPayload) {
        await apiFetch(`/attendance-requests/${requestIdFromPayload}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          requireAuth: true,
        });
        setScanSuccess(true);
        setQrPaste('');
        if (session && studentId && requestDate === session.attendanceDate && classId === session.classId) {
          setAttendance(prev => ({ ...prev, [studentId]: 'present' }));
          setSession(prev => prev ? {
            ...prev,
            students: prev.students.map(s => s.studentId === studentId ? { ...s, requestStatus: 'approved' } : s),
          } : null);
        }
        return;
      }
      if (!studentId || !enrollmentId || !classId || !requestDate) {
        setQrError('Invalid QR data: missing studentId, enrollmentId, classId or requestDate');
        return;
      }
      await apiFetch('/staff/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ studentId, enrollmentId, classId, requestDate }),
        requireAuth: true,
      });
      setScanSuccess(true);
      setQrPaste('');
      if (session && requestDate === session.attendanceDate && classId === session.classId) {
        setAttendance(prev => ({ ...prev, [studentId]: 'present' }));
        setSession(prev => prev ? {
          ...prev,
          students: prev.students.map(s => s.studentId === studentId ? { ...s, requestStatus: 'approved' } : s),
        } : null);
      }
    } catch (e: any) {
      setQrError(e.message || 'Invalid QR data or scan failed');
    }
  };

  const handleMarkPresent = async (s: SessionStudent) => {
    if (!session) return;
    try {
      await apiFetch('/staff/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          studentId: s.studentId,
          enrollmentId: s.enrollmentId,
          classId: session.classId,
          requestDate: session.attendanceDate,
        }),
        requireAuth: true,
      });
      setAttendance(prev => ({ ...prev, [s.studentId]: 'present' }));
      setSession(prev => prev ? { ...prev, students: prev.students.map(st => st.studentId === s.studentId ? { ...st, requestStatus: 'approved' } : st) } : null);
    } catch (_) {}
  };

  const handleSubmitToAdmin = async () => {
    if (!session || !selectedSlot) return;
    const presentStudentIds = session.students.filter(s => attendance[s.studentId] === 'present' || attendance[s.studentId] === 'late').map(s => s.studentId);
    setSubmitToAdminLoading(true);
    setSubmitSuccess(false);
    try {
      await apiFetch('/lecturer-attendance', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: session.scheduleId ?? undefined,
          classId: session.classId,
          attendanceDate: session.attendanceDate,
          presentStudentIds,
        }),
        requireAuth: true,
      });
      setSubmitSuccess(true);
      setSubmissionStatusByKey(prev => ({ ...prev, [`${session.classId}-${session.attendanceDate}`]: 'pending' }));
      setTimeout(() => {
        setSelectedSlot(null);
        setSession(null);
      }, 2000);
    } catch (_) {}
    finally {
      setSubmitToAdminLoading(false);
    }
  };

  const presentCount = session ? session.students.filter(s => attendance[s.studentId] === 'present' || attendance[s.studentId] === 'late').length : 0;

  const rows = Math.ceil(((HOUR_END - HOUR_START) * 60) / SLOT_MINUTES);
  const slotTop = (startTime: string) => {
    const mins = parseTime(startTime) - HOUR_START * 60;
    return (mins / ((HOUR_END - HOUR_START) * 60)) * 100;
  };
  const slotHeight = (startTime: string, endTime: string) => {
    const d = parseTime(endTime) - parseTime(startTime);
    return (d / ((HOUR_END - HOUR_START) * 60)) * 100;
  };
  const slotLeft = (dayOfWeek: number) => (dayOfWeek - 1) * (100 / 7);
  const slotWidth = 100 / 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('staff.scheduleAndAttendance')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
        {lang === 'fr'
          ? "Cliquez sur un créneau pour indiquer qui était présent, puis soumettez la présence à l'admin pour validation et paiement de votre cours."
          : 'Click a class slot to mark who attended, then submit your class attendance to admin for approval so you can get paid for teaching that day.'}
      </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addWeeksToWeekStart(weekStart, -1))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[220px] text-center text-sm font-medium text-gray-900 dark:text-white">
            {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – {new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekStart(addWeeksToWeekStart(weekStart, 1))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded shrink-0" style={{ background: 'var(--btc-primary,#2563eb)' }} />
            {lang === 'fr' ? 'Non soumis' : 'Not submitted'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded shrink-0 bg-amber-500" />
            {lang === 'fr' ? 'En attente d\'approbation' : 'Pending approval'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded shrink-0 bg-green-600" />
            {lang === 'fr' ? 'Approuvé' : 'Approved'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded shrink-0 bg-red-600" />
            {lang === 'fr' ? 'Rejeté' : 'Rejected'}
          </span>
        </div>
      </div>

      {slotsLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : slots.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucun cours cette semaine.' : 'No classes this week.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
          <div className="flex min-w-[700px]">
            <div className="w-14 shrink-0 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="h-10 border-b border-gray-100 dark:border-gray-700" />
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="h-8 text-xs text-gray-500 dark:text-gray-400 pl-1 pt-0.5" style={{ height: 32 }}>
                  {formatTime(HOUR_START * 60 + i * SLOT_MINUTES)}
                </div>
              ))}
            </div>
            <div className="flex-1 relative" style={{ width: 7 * 120 }}>
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30" style={{ height: 40 }}>
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="border-l border-gray-100 dark:border-gray-700 py-1.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {label}
                    <div className="text-[10px] font-normal text-gray-400">{new Date(weekDates[i]).getDate()}</div>
                  </div>
                ))}
              </div>
              <div className="relative" style={{ height: rows * 32 }}>
                <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${rows}, 32px)` }}>
                  {Array.from({ length: rows * 7 }, (_, idx) => (
                    <div key={idx} className="border-b border-l border-gray-100 dark:border-gray-700 border-dashed" />
                  ))}
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative w-full h-full pointer-events-auto">
                    {slots.map((slot, i) => {
                      const top = slotTop(slot.startTime);
                      const height = slotHeight(slot.startTime, slot.endTime);
                      const left = slotLeft(slot.dayOfWeek);
                      const slotDate = weekDates[slot.dayOfWeek - 1];
                      const isSelected = selectedSlot?.id === slot.id && attendanceDate === slotDate;
                      const submitStatus = submissionStatusByKey[`${slot.classId}-${slotDate}`];
                      const slotColors = submitStatus === 'approved'
                        ? { bg: '#16a34a', border: '#15803d', selectedBg: '#15803d' }
                        : submitStatus === 'pending'
                          ? { bg: '#d97706', border: '#b45309', selectedBg: '#b45309' }
                          : submitStatus === 'rejected'
                            ? { bg: '#dc2626', border: '#b91c1c', selectedBg: '#b91c1c' }
                            : { bg: 'var(--btc-primary,#2563eb)', border: 'var(--btc-primary,#2563eb)', selectedBg: '#1d4ed8' };
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => openSession(slot, slotDate)}
                          className="absolute rounded-lg border overflow-hidden shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 ring-blue-400 text-left"
                          style={{
                            left: `calc(${left}% + 2px)`,
                            width: `calc(${slotWidth}% - 6px)`,
                            top: `${top}%`,
                            height: `calc(${height}% - 4px)`,
                            minHeight: 24,
                            background: isSelected ? slotColors.selectedBg : slotColors.bg,
                            borderColor: isSelected ? slotColors.selectedBg : slotColors.border,
                          }}
                        >
                          <div className="p-1.5 text-[11px] leading-tight overflow-hidden h-full flex flex-col text-white">
                            {slot.classCode && <span className="font-mono text-[9px] opacity-80 truncate">{slot.classCode}</span>}
                            <span className="font-semibold truncate">{slot.className || slot.programName}</span>
                            {slot.lessonTitle && <span className="truncate opacity-90">{slot.lessonTitle}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setSelectedSlot(null); setSession(null); }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} style={{ color: 'var(--btc-primary,#2563eb)' }} />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedSlot.className || selectedSlot.programName}</span>
              <span className="text-xs text-gray-400">{attendanceDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={markAllPresent} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors">
                {lang === 'fr' ? 'Tous présents' : 'Mark all present'}
              </button>
              {session && <span className="text-xs text-gray-400">{presentCount}/{session.students.length}</span>}
              <button type="button" onClick={() => { setSelectedSlot(null); setSession(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* QR scan / paste */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                <QrCode size={12} className="inline mr-1" /> {lang === 'fr' ? 'Coller les données QR (étudiant scanné)' : 'Paste QR data (scanned student)'}
              </label>
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Coller le lien d\'approbation ou le JSON QR' : 'Paste approval link or QR JSON'}
                value={qrPaste}
                onChange={e => { setQrPaste(e.target.value); setQrError(''); setScanSuccess(false); }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-mono"
              />
            </div>
            <button onClick={handleScanFromPaste} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">
              {lang === 'fr' ? 'Ajouter' : 'Add'}
            </button>
            {qrError && <p className="text-xs text-red-500 w-full">{qrError}</p>}
            {scanSuccess && <p className="text-xs text-green-600 w-full">{lang === 'fr' ? 'Étudiant ajouté.' : 'Student added.'}</p>}
          </div>

          <div className="overflow-auto flex-1 min-h-0">
          {sessionLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
          ) : session && session.students.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {session.students.map((s, i) => (
                  <motion.div
                    key={s.studentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--btc-primary,#2563eb)' }}>
                        {(s.name || s.email || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name || s.email || s.studentId?.slice(0, 8)}</p>
                        {s.requestStatus && <span className={`text-xs px-1.5 py-0.5 rounded ${s.requestStatus === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : s.requestStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'}`}>{s.requestStatus}</span>}
                        {s.comment && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.comment}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.requestStatus !== 'approved' && (
                        <button onClick={() => handleMarkPresent(s)} className="text-xs px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100">
                          {lang === 'fr' ? 'Présent' : 'Present'}
                        </button>
                      )}
                      {[
                        { val: 'present', icon: CheckCircle, color: 'green', label: t('att.present') },
                        { val: 'late', icon: Clock, color: 'yellow', label: t('att.late') },
                        { val: 'absent', icon: XCircle, color: 'red', label: t('att.absent') },
                      ].map(opt => {
                        const active = attendance[s.studentId] === opt.val;
                        return (
                          <button
                            key={opt.val}
                            onClick={() => mark(s.studentId, opt.val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border ${
                              active
                                ? opt.color === 'green' ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400'
                                : opt.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-50 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-400'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            <opt.icon size={12} /> {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {presentCount} {t('att.present')}</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-yellow-500" /> {Object.values(attendance).filter(v => v === 'late').length} {t('att.late')}</span>
                  <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> {Object.values(attendance).filter(v => v === 'absent').length} {t('att.absent')}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                    {lang === 'fr'
                      ? "Soumettez la liste des présents à l'admin. Une fois approuvée, votre cours sera pris en compte pour votre rémunération."
                      : 'Submit the list of who attended so admin can approve it. Once approved, this session counts toward your payment.'}
                  </p>
                  <button
                    onClick={handleSubmitToAdmin}
                    disabled={submitToAdminLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shrink-0 ${submitSuccess ? 'bg-green-600' : ''}`}
                    style={!submitSuccess ? { background: 'var(--btc-primary,#2563eb)' } : {}}
                  >
                    {submitToAdminLoading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                    {submitSuccess
                      ? (lang === 'fr' ? 'Envoyé !' : 'Submitted!')
                      : (lang === 'fr' ? 'Soumettre la présence pour paiement' : 'Submit attendance for payment')}
                  </button>
                </div>
              </div>
            </>
          ) : session ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              {session.notAssigned ? (
                <p>{lang === 'fr' ? "Vous n'êtes pas assigné comme enseignant pour ce cours à cette date." : 'You are not assigned as teacher for this class on this date.'}</p>
              ) : (
                <p>{lang === 'fr' ? 'Aucun étudiant inscrit à ce cours.' : 'No students enrolled in this class.'}</p>
              )}
            </div>
          ) : null}
          </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
