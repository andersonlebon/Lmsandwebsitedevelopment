import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, User, BookOpen, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_MINUTES = 30;

function parseTime(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface WeekSlot {
  classId: string;
  classCode?: string;
  className: string;
  programId: string;
  programName: string;
  programNameFr?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  scheduleId: string | null;
  staffId: string | null;
  staffName: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
}

export function StaffSchedules() {
  const { lang } = useLanguage();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [promotionId, setPromotionId] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr?: string; departmentId?: string }[]>([]);
  const [promotions, setPromotions] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [slots, setSlots] = useState<WeekSlot[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string; titleFr?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<WeekSlot | null>(null);
  const [form, setForm] = useState({ staffId: '', lessonId: '', lessonTitle: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/departments', { requireAuth: true }).then((d: any) => setDepartments(d.departments || [])).catch(() => {}),
      apiFetch('/programs', { requireAuth: true }).then((d: any) => setPrograms(d.programs || [])).catch(() => {}),
      apiFetch('/promotions', { requireAuth: true }).then((d: any) => setPromotions(d.promotions || [])).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    loadWeek();
  }, [weekStart, departmentId, programId, promotionId]);

  const hasFilter = !!(departmentId || programId || promotionId);

  const loadWeek = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ weekStart });
      if (departmentId) params.set('departmentId', departmentId);
      if (programId) params.set('programId', programId);
      if (promotionId) params.set('promotionId', promotionId);
      const [weekRes, staffRes, lessonsRes] = await Promise.all([
        apiFetch(`/staff-schedules/week?${params.toString()}`, { requireAuth: true }),
        apiFetch('/staff', { requireAuth: true }),
        apiFetch('/lessons', { requireAuth: true }),
      ]);
      const rawSlots = weekRes.slots || [];
      setSlots(rawSlots.filter((s: WeekSlot) => s.dayOfWeek >= 1 && s.dayOfWeek <= 7));
      setStaff(staffRes.staff || []);
      setLessons(lessonsRes.lessons || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const openAssign = (slot: WeekSlot) => {
    setSelectedSlot(slot);
    setForm({
      staffId: slot.staffId || '',
      lessonId: slot.lessonId || '',
      lessonTitle: slot.lessonTitle || '',
    });
    setError('');
  };

  const handleSave = async () => {
    if (!selectedSlot) return;
    if (!form.staffId) {
      setError(lang === 'fr' ? 'Choisissez un enseignant.' : 'Select a lecturer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (selectedSlot.scheduleId) {
        await apiFetch(`/staff-schedules/${selectedSlot.scheduleId}`, {
          method: 'PATCH',
        body: JSON.stringify({
          staffId: form.staffId,
          lessonId: form.lessonId || undefined,
          lessonTitle: form.lessonTitle || undefined,
        }),
          requireAuth: true,
        });
      } else {
        await apiFetch('/staff-schedules', {
          method: 'POST',
          body: JSON.stringify({
            classId: selectedSlot.classId,
            weekStart,
            dayOfWeek: selectedSlot.dayOfWeek,
            staffId: form.staffId,
            lessonId: form.lessonId || undefined,
            lessonTitle: form.lessonTitle || undefined,
          }),
          requireAuth: true,
        });
      }
      setSelectedSlot(null);
      loadWeek();
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedSlot?.scheduleId) return;
    if (!confirm(lang === 'fr' ? 'Retirer l\'assignation ?' : 'Remove this assignment?')) return;
    try {
      await apiFetch(`/staff-schedules/${selectedSlot.scheduleId}`, { method: 'DELETE', requireAuth: true });
      setSelectedSlot(null);
      loadWeek();
    } catch (e: any) {
      setError(e.message || 'Failed');
    }
  };

  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const rows = totalMinutes / SLOT_MINUTES;
  const weekDates: string[] = [];
  const mon = new Date(weekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const slotTop = (startTime: string) => {
    const mins = parseTime(startTime) - HOUR_START * 60;
    return Math.max(0, (mins / totalMinutes) * 100);
  };
  const slotHeight = (startTime: string, endTime: string) => {
    const dur = parseTime(endTime) - parseTime(startTime);
    return Math.max(2, (dur / totalMinutes) * 100);
  };
  const slotLeft = (dayOfWeek: number) => ((dayOfWeek - 1) / 7) * 100;
  const slotWidth = 100 / 7;

  const weekTitle = (() => {
    const monDate = new Date(weekStart + 'T12:00:00');
    const sunDate = new Date(monDate);
    sunDate.setDate(monDate.getDate() + 6);
    return `${monDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${sunDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Plannings staff' : 'Staff schedules'}
        </h1>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Filters: by department, program, or promotion to reduce overlap when many classes at same time */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Filtrer le calendrier :' : 'Filter calendar:'}</span>
        <select
          value={departmentId}
          onChange={e => { setDepartmentId(e.target.value); setProgramId(''); setPromotionId(''); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[160px]"
        >
          <option value="">{lang === 'fr' ? 'Tous les départements' : 'All departments'}</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{lang === 'fr' && d.nameFr ? d.nameFr : d.name}</option>
          ))}
        </select>
        <select
          value={programId}
          onChange={e => setProgramId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[180px]"
        >
          <option value="">{lang === 'fr' ? 'Tous les programmes' : 'All programs'}</option>
          {programs
            .filter(p => !departmentId || p.departmentId === departmentId)
            .map(p => (
              <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>
            ))}
        </select>
        <select
          value={promotionId}
          onChange={e => setPromotionId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[160px]"
        >
          <option value="">{lang === 'fr' ? 'Toutes les promotions' : 'All promotions'}</option>
          {promotions.map(p => (
            <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>
          ))}
        </select>
        {(departmentId || programId || promotionId) && (
          <button
            type="button"
            onClick={() => { setDepartmentId(''); setProgramId(''); setPromotionId(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            {lang === 'fr' ? 'Réinitialiser' : 'Clear filters'}
          </button>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {lang === 'fr' ? 'Filtrez par promotion ou programme pour éviter le chevauchement des créneaux.' : 'Filter by promotion or program to avoid overlapping slots.'}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-gray-400" /></div>
      ) : slots.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">{lang === 'fr' ? 'Aucun créneau pour cette semaine.' : 'No classes for this week.'}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {hasFilter
              ? (lang === 'fr' ? 'Changez les filtres ou ajoutez des classes dans Académique → Classes.' : 'Change filters or add classes in Academic → Classes.')
              : (lang === 'fr' ? 'Ajoutez des classes dans Académique → Classes.' : 'Add classes in Academic → Classes.')}
          </p>
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
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30" style={{ height: 40 }}>
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="border-l border-gray-100 dark:border-gray-700 py-1.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {label}
                    <div className="text-[10px] font-normal text-gray-400">{new Date(weekDates[i]).getDate()}</div>
                  </div>
                ))}
              </div>
              {/* Body: time grid + events overlay */}
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
                      const isAssigned = !!slot.scheduleId;
                      return (
                        <div
                          key={`${slot.classId}-${slot.dayOfWeek}-${slot.startTime}-${i}`}
                          className="absolute rounded-lg border cursor-pointer overflow-hidden shadow-sm transition-all hover:ring-2 hover:ring-offset-1 ring-green-400"
                          style={{
                            left: `calc(${left}% + 2px)`,
                            width: `calc(${slotWidth}% - 6px)`,
                            top: `${top}%`,
                            height: `calc(${height}% - 4px)`,
                            minHeight: 24,
                            background: isAssigned ? 'var(--btc-primary,#2E8B57)' : 'rgba(148, 163, 184, 0.3)',
                            borderColor: isAssigned ? 'var(--btc-primary,#2E8B57)' : 'rgb(203, 213, 225)',
                          }}
                          onClick={() => openAssign(slot)}
                        >
                          <div className="p-1.5 text-[11px] leading-tight overflow-hidden h-full flex flex-col text-white">
                            {slot.classCode && <span className="font-mono text-[9px] opacity-80 truncate">{slot.classCode}</span>}
                            <span className="font-semibold truncate">{slot.className || slot.programName}</span>
                            {slot.staffName && <span className="truncate opacity-90 flex items-center gap-0.5"><User size={9} /> {slot.staffName}</span>}
                            {slot.lessonTitle && <span className="truncate opacity-90 flex items-center gap-0.5"><BookOpen size={9} /> {slot.lessonTitle}</span>}
                            {!slot.staffName && <span className="opacity-75 italic">{lang === 'fr' ? 'Non assigné' : 'Unassigned'}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {lang === 'fr' ? 'Cliquez sur un créneau pour assigner un enseignant et le cours/leçon.' : 'Click a slot to assign a lecturer and the lesson/course for that day.'}
      </p>

      {/* Assign / Edit modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedSlot(null)}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins' }}>
              {selectedSlot.scheduleId ? (lang === 'fr' ? 'Modifier l\'assignation' : 'Edit assignment') : (lang === 'fr' ? 'Assigner enseignant' : 'Assign lecturer')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {selectedSlot.classCode && <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-1">{selectedSlot.classCode}</span>}
              {selectedSlot.className || selectedSlot.programName} · {DAY_LABELS[selectedSlot.dayOfWeek - 1]} {selectedSlot.startTime}–{selectedSlot.endTime}
              {selectedSlot.room && ` · ${selectedSlot.room}`}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {lang === 'fr' ? 'Assignez une leçon (créées dans Académique → Leçons). Les exercices et évaluations se gèrent ailleurs.' : 'Assign a lesson (create lessons in Academic → Lessons). Exercises and assessments are managed separately.'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Enseignant' : 'Lecturer'}</label>
                <select
                  value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">—</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Leçon à enseigner' : 'Lesson to teach'}</label>
                <select
                  value={form.lessonId}
                  onChange={e => {
                    const id = e.target.value;
                    const lesson = lessons.find(l => l.id === id);
                    setForm(f => ({ ...f, lessonId: id, lessonTitle: lesson ? (lang === 'fr' && lesson.titleFr ? lesson.titleFr : lesson.title) : f.lessonTitle }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">— {lang === 'fr' ? 'Choisir une leçon' : 'Select a lesson'}</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{lang === 'fr' && l.titleFr ? l.titleFr : l.title}</option>
                  ))}
                </select>
                {lessons.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {lang === 'fr' ? 'Aucune leçon. Créez-en dans Académique → Leçons.' : 'No lessons yet. Create them in Academic → Lessons.'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre affiché (optionnel)' : 'Display title override (optional)'}</label>
                <input
                  type="text"
                  value={form.lessonTitle}
                  onChange={e => setForm(f => ({ ...f, lessonTitle: e.target.value }))}
                  placeholder={lang === 'fr' ? 'Ex: Chapitre 3 - Algèbre' : 'e.g. Chapter 3 - Algebra'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <div>
                {selectedSlot.scheduleId && (
                  <button type="button" onClick={handleRemove} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={14} className="inline mr-1" /> {lang === 'fr' ? 'Retirer' : 'Remove'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedSlot(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
