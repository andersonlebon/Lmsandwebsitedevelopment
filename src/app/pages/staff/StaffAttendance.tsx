import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Clock, QrCode, Users, Save, Send, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function StaffAttendance() {
  const { t, lang } = useLanguage();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(toYYYYMMDD(new Date()));
  const [session, setSession] = useState<{ classId: string; attendanceDate: string; scheduleId?: string; students: SessionStudent[] } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({}); // studentId -> 'present' | 'late' | 'absent'
  const [submitToAdminLoading, setSubmitToAdminLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [qrPaste, setQrPaste] = useState('');
  const [qrError, setQrError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

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

  const openSession = (slot: ScheduleSlot, date: string) => {
    setSelectedSlot(slot);
    setAttendanceDate(date);
    setSession(null);
    setAttendance({});
    setSessionLoading(true);
    apiFetch(`/staff/attendance/session?classId=${slot.classId}&attendanceDate=${date}`, { requireAuth: true })
      .then((d: any) => {
        setSession({ classId: d.classId, attendanceDate: d.attendanceDate, scheduleId: d.scheduleId, students: d.students || [] });
        const initial: Record<string, string> = {};
        (d.students || []).forEach((s: SessionStudent) => {
          if (s.requestStatus === 'approved') initial[s.studentId] = 'present';
          else if (s.requestStatus === 'rejected') initial[s.studentId] = 'absent';
          else if (s.requestStatus === 'pending') initial[s.studentId] = ''; // leave unset or could default present
        });
        setAttendance(initial);
      })
      .catch(() => setSession({ classId: slot.classId, attendanceDate: date, scheduleId: undefined, students: [] }))
      .finally(() => setSessionLoading(false));
  };

  const weekDates = DAY_LABELS.map((_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return toYYYYMMDD(d);
  });

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
    try {
      const payload = JSON.parse(qrPaste);
      const { studentId, enrollmentId, classId, requestDate } = payload;
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
    const presentStudentIds = session.students.filter(s => attendance[s.studentId] === 'present').map(s => s.studentId);
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
      setTimeout(() => {
        setSelectedSlot(null);
        setSession(null);
      }, 2000);
    } catch (_) {}
    finally {
      setSubmitToAdminLoading(false);
    }
  };

  const presentCount = session ? session.students.filter(s => attendance[s.studentId] === 'present').length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('att.markAttendance')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Marquez la présence, puis soumettez à l\'admin pour validation (rémunération).' : 'Mark attendance, then submit to admin for approval (payroll).'}</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(weekStart + 'T12:00:00'); d.setDate(d.getDate() - 7); setWeekStart(d.toISOString().slice(0, 10)); }} className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium text-gray-900 dark:text-white">
            {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })} {new Date(weekStart).getDate()} – {new Date(weekDates[6]).getDate()}
          </span>
          <button onClick={() => { const d = new Date(weekStart + 'T12:00:00'); d.setDate(d.getDate() + 7); setWeekStart(d.toISOString().slice(0, 10)); }} className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {slotsLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map(slot => {
            const slotDate = weekDates[slot.dayOfWeek - 1];
            const isToday = slotDate === toYYYYMMDD(new Date());
            return (
              <button
                key={slot.id}
                onClick={() => openSession(slot, slotDate)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                  selectedSlot?.id === slot.id && attendanceDate === slotDate
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                style={selectedSlot?.id === slot.id && attendanceDate === slotDate ? { background: 'var(--btc-primary,#2563eb)' } : {}}
              >
                <span className="block font-semibold">{slot.className || slot.programName}</span>
                <span className="text-xs opacity-90">{DAY_LABELS[slot.dayOfWeek - 1]} {slot.startTime} · {slotDate}{isToday ? ' (today)' : ''}</span>
              </button>
            );
          })}
          {slots.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Aucun cours cette semaine.' : 'No classes this week.'}</p>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
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
                placeholder='{"studentId":"...","enrollmentId":"...","classId":"...","requestDate":"YYYY-MM-DD"}'
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
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {presentCount} {t('att.present')}</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-yellow-500" /> {Object.values(attendance).filter(v => v === 'late').length} {t('att.late')}</span>
                  <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> {Object.values(attendance).filter(v => v === 'absent').length} {t('att.absent')}</span>
                </div>
                <button
                  onClick={handleSubmitToAdmin}
                  disabled={submitToAdminLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${submitSuccess ? 'bg-green-500' : ''}`}
                  style={!submitSuccess ? { background: 'var(--btc-primary,#2563eb)' } : {}}
                >
                  {submitToAdminLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitSuccess ? (lang === 'fr' ? 'Envoyé !' : 'Submitted!') : (lang === 'fr' ? 'Soumettre à l\'admin' : 'Submit to admin')}
                </button>
              </div>
            </>
          ) : session ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p>{lang === 'fr' ? 'Aucun étudiant inscrit à ce cours.' : 'No students enrolled in this class.'}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
