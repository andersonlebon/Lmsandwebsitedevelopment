import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Video, ChevronLeft, ChevronRight, BookOpen, Send, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const TYPE_BADGES: Record<string, string> = {
  class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  virtual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deadline: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

export function PortalCalendar() {
  const today = toYYYYMMDD(new Date());
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({ enrollmentId: '', classId: '', teacherId: '', address: '' });
  const [submitAttendanceLoading, setSubmitAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

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
    apiFetch('/staff', { requireAuth: true })
      .then((d: any) => setStaff(d.staff || []))
      .catch(() => setStaff([]));
  }, []);

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
      await apiFetch('/attendance-requests', {
        method: 'POST',
        body: JSON.stringify({
          enrollmentId: attendanceForm.enrollmentId,
          classId: attendanceForm.classId,
          teacherId: attendanceForm.teacherId,
          address: attendanceForm.address || undefined,
          requestDate: selectedDate,
        }),
        requireAuth: true,
      });
      setAttendanceSuccess(true);
      setAttendanceForm({ enrollmentId: '', classId: '', teacherId: '', address: '' });
    } catch (e: any) {
      setAttendanceError(e.message || 'Failed to submit');
    } finally {
      setSubmitAttendanceLoading(false);
    }
  };

  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your schedule and upcoming events</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{monthLabel}</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
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
                  {hasData && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--btc-primary,#16a34a)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail + attendance */}
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
                    {dayData.classes?.map((cl, i) => (
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
                      </motion.div>
                    ))}
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

          {/* Submit attendance (for selected day) */}
          {isSelectedDateToday && dayData && dayData.classes && dayData.classes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Submit attendance request</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Send a request for today’s class. Your teacher will approve or reject.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
                  <select
                    value={attendanceForm.classId}
                    onChange={e => {
                      const cl = dayData.classes.find(c => c.id === e.target.value);
                      setAttendanceForm(f => ({
                        ...f,
                        classId: e.target.value,
                        enrollmentId: cl?.enrollmentId ?? '',
                      }));
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
    </div>
  );
}
