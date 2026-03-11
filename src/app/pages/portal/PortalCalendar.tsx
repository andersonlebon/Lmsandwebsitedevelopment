import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, BookOpen, Send, Loader2, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../lib/api';

const TYPE_BADGES: Record<string, string> = {
  class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  virtual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deadline: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_MINUTES = 30;

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

interface DayClass {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  progName?: string;
  progNameFr?: string;
  enrollmentId?: string;
}

interface DayActivity {
  id: string;
  type: string;
  title: string;
  titleFr?: string;
}

interface DayData {
  date: string;
  dayOfWeek: number;
  classes: DayClass[];
  activities: DayActivity[];
}

interface WeekSlot {
  classId: string;
  classCode?: string;
  className: string;
  programName?: string;
  programNameFr?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  enrollmentId: string;
  staffId?: string | null;
  staffName?: string | null;
}

interface AttendanceRequest {
  id: string;
  classId: string;
  enrollmentId: string;
  requestDate: string;
  status: string;
  comment?: string | null;
}

export function PortalCalendar() {
  const { user } = useAuth();
  const today = toYYYYMMDD(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [weekSlots, setWeekSlots] = useState<WeekSlot[]>([]);
  const [myRequests, setMyRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekLoading, setWeekLoading] = useState(false);
  const [staff, setStaff] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({ enrollmentId: '', classId: '', teacherId: '', address: '', comment: '' });
  const [submitAttendanceLoading, setSubmitAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [qrModal, setQrModal] = useState<{ requestId: string; studentId: string } | null>(null);
  const [selectedWeekSlot, setSelectedWeekSlot] = useState<{ slot: WeekSlot; dateStr: string } | null>(null);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const calendarDays: { day: number; dateStr: string }[] = [];
  for (let i = 0; i < startPad; i++) calendarDays.push({ day: 0, dateStr: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr });
  }

  const weekDates = DAY_LABELS.map((_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/portal/calendar/day?date=${selectedDate}`, { requireAuth: true })
      .then((d: any) => {
        if (!cancelled) setDayData({ date: d.date, dayOfWeek: d.dayOfWeek, classes: d.classes || [], activities: d.activities || [] });
      })
      .catch(() => {
        if (!cancelled) setDayData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedDate]);

  useEffect(() => {
    apiFetch(`/portal/attendance-requests/me?date=${selectedDate}`, { requireAuth: true })
      .then((d: any) => setMyRequests(d.requests || []))
      .catch(() => setMyRequests([]));
  }, [selectedDate]);

  useEffect(() => {
    if (viewMode !== 'week') return;
    let cancelled = false;
    setWeekLoading(true);
    apiFetch(`/portal/calendar/week?weekStart=${weekStart}`, { requireAuth: true })
      .then((d: any) => {
        if (!cancelled) setWeekSlots(d.slots || []);
      })
      .catch(() => {
        if (!cancelled) setWeekSlots([]);
      })
      .finally(() => {
        if (!cancelled) setWeekLoading(false);
      });
    return () => { cancelled = true; };
  }, [viewMode, weekStart]);

  useEffect(() => {
    apiFetch('/staff', { requireAuth: true })
      .then((d: any) => setStaff(d.staff || []))
      .catch(() => setStaff([]));
  }, []);

  // When slot is opened and they already submitted for this class/date, show QR popup instead of form
  useEffect(() => {
    if (!selectedWeekSlot || !user?.id) return;
    if (selectedDate !== selectedWeekSlot.dateStr) return; // myRequests not yet for this date
    const existing = myRequests.find(
      r => r.classId === selectedWeekSlot.slot.classId && r.requestDate === selectedWeekSlot.dateStr
    );
    if (existing) {
      setQrModal({ requestId: existing.id, studentId: user.id });
      setSelectedWeekSlot(null);
    }
  }, [selectedWeekSlot, selectedDate, myRequests, user?.id]);

  const isSelectedDateToday = selectedDate === today;

  const handleSubmitAttendance = async () => {
    if (!attendanceForm.enrollmentId || !attendanceForm.classId || !attendanceForm.teacherId) {
      setAttendanceError('Please select class and teacher.');
      return;
    }
    setSubmitAttendanceLoading(true);
    setAttendanceError('');
    setAttendanceSuccess(false);
    try {
      const data: any = await apiFetch('/attendance-requests', {
        method: 'POST',
        body: JSON.stringify({
          enrollmentId: attendanceForm.enrollmentId,
          classId: attendanceForm.classId,
          teacherId: attendanceForm.teacherId,
          address: attendanceForm.address || undefined,
          comment: attendanceForm.comment || undefined,
          requestDate: selectedDate,
        }),
        requireAuth: true,
      });
      setAttendanceSuccess(true);
      setAttendanceForm(prev => ({ ...prev, address: '', comment: '' }));
      if (data?.request?.id && user?.id) {
        setQrModal({ requestId: data.request.id, studentId: user.id });
      }
      apiFetch(`/portal/attendance-requests/me?date=${selectedDate}`, { requireAuth: true })
        .then((d: any) => setMyRequests(d.requests || []))
        .catch(() => {});
    } catch (e: any) {
      setAttendanceError(e.message || 'Failed to submit');
    } finally {
      setSubmitAttendanceLoading(false);
    }
  };

  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekTitle = `${new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const getRequestForClass = (classId: string) => myRequests.find(r => r.classId === classId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your schedule and activity — submit attendance and leave a comment for the day</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-2 rounded-xl text-sm font-medium ${viewMode === 'month' ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600'}`}
            style={viewMode === 'month' ? { background: 'var(--btc-primary,#16a34a)' } : {}}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-2 rounded-xl text-sm font-medium ${viewMode === 'week' ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600'}`}
            style={viewMode === 'week' ? { background: 'var(--btc-primary,#16a34a)' } : {}}
          >
            Week
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{monthLabel}</h3>
              <div className="flex gap-1">
                <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                if (cell.day === 0) return <div key={i} />;
                const dateStr = cell.dateStr;
                const hasData = dayData?.date === dateStr && ((dayData?.classes?.length ?? 0) + (dayData?.activities?.length ?? 0)) > 0;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                      isSelected ? 'text-white shadow-lg' : isToday ? 'bg-green-50 dark:bg-green-900/20 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    style={isSelected ? { background: 'var(--btc-primary,#16a34a)' } : {}}
                  >
                    {cell.day}
                    {hasData && !isSelected && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--btc-primary,#16a34a)' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {dayData ? `${dayData.classes?.length ?? 0} class(es), ${dayData.activities?.length ?? 0} activity(ies)` : 'No data'}
                  </p>
                  {dayData && (dayData.classes?.length > 0 || dayData.activities?.length > 0) ? (
                    <div className="space-y-3">
                      {dayData.classes?.map((cl, i) => {
                        const req = getRequestForClass(cl.id);
                        return (
                          <motion.div
                            key={cl.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-700/50 border-green-500"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock size={11} /> {cl.startTime ?? '—'} – {cl.endTime ?? '—'}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">class</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cl.name}</p>
                            {cl.room && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin size={11} /> {cl.room}
                              </p>
                            )}
                            {req && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'}`}>
                                  {req.status}
                                </span>
                                {req.comment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{req.comment}</p>}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      {dayData.activities?.map((a, i) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (dayData.classes?.length ?? 0) * 0.05 + i * 0.05 }}
                          className="p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-700/50 border-blue-500"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen size={11} className="text-gray-500" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{a.type}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.titleFr || a.title}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No classes or activities for this day</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {dayData && dayData.classes && dayData.classes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-gray-900 dark:text-white font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Submit attendance & comment</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Request attendance for this day. Add a comment (optional). Your teacher can also scan your QR in class.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
                    <select
                      value={attendanceForm.classId}
                      onChange={e => {
                        const cl = dayData.classes.find(c => c.id === e.target.value);
                        setAttendanceForm(f => ({ ...f, classId: e.target.value, enrollmentId: cl?.enrollmentId ?? '' }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Select class</option>
                      {dayData.classes.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name} {cl.startTime}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teacher</label>
                    <select
                      value={attendanceForm.teacherId}
                      onChange={e => setAttendanceForm(f => ({ ...f, teacherId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Select teacher</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comment for this day (optional)</label>
                    <textarea
                      placeholder="e.g. Attended in person, room 12"
                      value={attendanceForm.comment}
                      onChange={e => setAttendanceForm(f => ({ ...f, comment: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location (optional)</label>
                    <input
                      type="text"
                      placeholder="Address or place"
                      value={attendanceForm.address}
                      onChange={e => setAttendanceForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  {attendanceError && <p className="text-sm text-red-500">{attendanceError}</p>}
                  {attendanceSuccess && <p className="text-sm text-green-600">Request sent successfully.</p>}
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={submitAttendanceLoading || !attendanceForm.classId || !attendanceForm.teacherId}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                    style={{ background: 'var(--btc-primary,#16a34a)' }}
                  >
                    {submitAttendanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const d = new Date(weekStart + 'T12:00:00');
                d.setDate(d.getDate() - 7);
                setWeekStart(d.toISOString().slice(0, 10));
              }}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[220px] text-center font-medium text-gray-900 dark:text-white">{weekTitle}</span>
            <button
              onClick={() => {
                const d = new Date(weekStart + 'T12:00:00');
                d.setDate(d.getDate() + 7);
                setWeekStart(d.toISOString().slice(0, 10));
              }}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {weekLoading ? (
            <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-gray-400" /></div>
          ) : weekSlots.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No classes this week.</p>
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
                        {weekSlots.map((slot, i) => {
                          const top = slotTop(slot.startTime);
                          const height = slotHeight(slot.startTime, slot.endTime);
                          const left = slotLeft(slot.dayOfWeek);
                          const dateStr = weekDates[slot.dayOfWeek - 1];
                          const isSelected = selectedWeekSlot?.slot.classId === slot.classId && selectedWeekSlot?.slot.dayOfWeek === slot.dayOfWeek && selectedWeekSlot?.dateStr === dateStr;
                          return (
                            <button
                              type="button"
                              key={`${slot.classId}-${slot.dayOfWeek}-${slot.startTime}-${i}`}
                              onClick={() => {
                                setSelectedWeekSlot({ slot, dateStr });
                                setSelectedDate(dateStr);
                                setQrModal(null);
                                setAttendanceForm(prev => ({
                                  ...prev,
                                  enrollmentId: slot.enrollmentId,
                                  classId: slot.classId,
                                  teacherId: slot.staffId || prev.teacherId,
                                  comment: '',
                                  address: '',
                                }));
                                setAttendanceError('');
                                setAttendanceSuccess(false);
                              }}
                              className="absolute rounded-lg border overflow-hidden shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 ring-white/80 text-left"
                              style={{
                                left: `calc(${left}% + 2px)`,
                                width: `calc(${slotWidth}% - 6px)`,
                                top: `${top}%`,
                                height: `calc(${height}% - 4px)`,
                                minHeight: 24,
                                background: isSelected ? '#15803d' : 'var(--btc-primary,#16a34a)',
                                borderColor: isSelected ? '#15803d' : 'var(--btc-primary,#16a34a)',
                              }}
                            >
                              <div className="p-1.5 text-[11px] leading-tight overflow-hidden h-full flex flex-col text-white">
                                {slot.classCode && <span className="font-mono text-[9px] opacity-80 truncate">{slot.classCode}</span>}
                                <span className="font-semibold truncate">{slot.className || slot.programName}</span>
                                {slot.staffName && <span className="truncate opacity-90">{slot.staffName}</span>}
                                <span className="text-[9px] opacity-75 mt-0.5">Click to add comment / submit attendance</span>
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Click a class to add a comment or submit attendance for that day.</p>
        </div>
      )}

      {selectedWeekSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedWeekSlot(null)}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                {selectedWeekSlot.slot.className || selectedWeekSlot.slot.programName}
              </h3>
              <button onClick={() => setSelectedWeekSlot(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {new Date(selectedWeekSlot.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · {selectedWeekSlot.slot.startTime} – {selectedWeekSlot.slot.endTime}
              {selectedWeekSlot.slot.room && ` · ${selectedWeekSlot.slot.room}`}
            </p>
            {(() => {
              const forThisDate = myRequests.find(r => r.classId === selectedWeekSlot.slot.classId && r.requestDate === selectedWeekSlot.dateStr);
              return forThisDate ? (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${forThisDate.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : forThisDate.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'}`}>
                    {forThisDate.status}
                  </span>
                  {forThisDate.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{forThisDate.comment}</p>}
                </div>
              ) : null;
            })()}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teacher</label>
                <select
                  value={attendanceForm.teacherId}
                  onChange={e => setAttendanceForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Select teacher</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comment for this day (optional)</label>
                <textarea
                  placeholder="e.g. Attended in person, room 12"
                  value={attendanceForm.comment}
                  onChange={e => setAttendanceForm(f => ({ ...f, comment: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location (optional)</label>
                <input
                  type="text"
                  placeholder="Address or place"
                  value={attendanceForm.address}
                  onChange={e => setAttendanceForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              {attendanceError && <p className="text-sm text-red-500">{attendanceError}</p>}
              {attendanceSuccess && <p className="text-sm text-green-600">Request sent successfully.</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={submitAttendanceLoading || !attendanceForm.teacherId}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--btc-primary,#16a34a)' }}
                >
                  {submitAttendanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit attendance
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setQrModal(null)}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">QR code for lecturer</h3>
              <button onClick={() => setQrModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">Lecturer scans this to open the approval page; the request will be approved when the page loads.</p>
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/staff/approve-attendance?requestId=${qrModal.requestId}&studentId=${qrModal.studentId}` : ''}
                size={200}
                level="M"
              />
            </div>
            {typeof window !== 'undefined' && (
              <a
                href={`${window.location.origin}/staff/approve-attendance?requestId=${qrModal.requestId}&studentId=${qrModal.studentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs text-gray-600 dark:text-gray-400 hover:underline break-all text-center max-w-[280px]"
              >
                {window.location.origin}/staff/approve-attendance?requestId={qrModal.requestId}&studentId={qrModal.studentId}
              </a>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
