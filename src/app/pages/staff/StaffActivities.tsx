import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ClipboardCheck, Loader2, CheckCircle, Calendar, X, Plus, Edit2, Trash2, CalendarCheck } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../lib/api';

interface SlotActivity {
  scheduleId: string;
  weekStart: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  lessonTitle: string | null;
  className?: string;
  activities: { id: string; type: string; title: string | null; titleFr: string | null; description: string | null; requiresSubmission: boolean | null; maxScore: string | number | null }[];
}

interface SubmissionToGrade {
  id: string;
  enrollmentId: string;
  activityId: string;
  status: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  studentName: string | null;
  studentEmail: string | null;
  activityTitle: string | null;
  activityTitleFr: string | null;
}

interface ActivityListItem {
  id: string;
  type: string;
  title: string;
  titleFr?: string;
  description?: string;
  programId?: string;
  requiresSubmission?: boolean;
  maxScore?: number;
  createdAt?: string;
  createdBy?: string;
}

interface MyScheduleSlot {
  scheduleId: string;
  weekStart: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  lessonTitle: string | null;
  className: string;
  classCode: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StaffActivities() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const myUserId = user?.id ?? null;
  const [tab, setTab] = useState<'activities' | 'manage' | 'submissions'>('activities');
  const [slots, setSlots] = useState<SlotActivity[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionToGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState<SubmissionToGrade | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '' as string | number, feedback: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Create & manage tab
  const [manageType, setManageType] = useState<'exercise' | 'assessment' | 'assignment'>('exercise');
  const [activitiesList, setActivitiesList] = useState<ActivityListItem[]>([]);
  const [activityModal, setActivityModal] = useState<'add' | 'edit' | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityListItem | null>(null);
  const [activityForm, setActivityForm] = useState({ title: '', titleFr: '', description: '', requiresSubmission: false });
  const [assignModal, setAssignModal] = useState<ActivityListItem | null>(null);
  const [myScheduleSlots, setMyScheduleSlots] = useState<MyScheduleSlot[]>([]);
  const [assignedScheduleIds, setAssignedScheduleIds] = useState<string[]>([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState<string[]>([]);

  useEffect(() => {
    if (tab === 'activities') loadMyActivities();
    else if (tab === 'submissions') loadSubmissions();
    else if (tab === 'manage') loadActivitiesList();
  }, [tab, manageType]);

  const loadActivitiesList = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch(`/learning-activities?type=${manageType}`, { requireAuth: true });
      setActivitiesList(d.activities || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setActivitiesList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch('/staff/my-activities', { requireAuth: true });
      setSlots(d.slots || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch('/staff/submissions-to-grade', { requireAuth: true });
      setSubmissions(d.submissions || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const openGrade = (s: SubmissionToGrade) => {
    setGradeModal(s);
    setGradeForm({ score: s.score ?? '', feedback: s.feedback ?? '' });
  };

  const saveGrade = async () => {
    if (!gradeModal) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/activity-submissions/${gradeModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'graded',
          score: gradeForm.score === '' ? undefined : Number(gradeForm.score),
          feedback: gradeForm.feedback,
        }),
        requireAuth: true,
      });
      setGradeModal(null);
      loadSubmissions();
    } catch (e: any) {
      setError(e.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const openAddActivity = () => {
    setEditingActivity(null);
    setActivityForm({ title: '', titleFr: '', description: '', requiresSubmission: manageType === 'assignment' });
    setActivityModal('add');
  };
  const openEditActivity = (a: ActivityListItem) => {
    setEditingActivity(a);
    setActivityForm({ title: a.title, titleFr: a.titleFr || '', description: a.description || '', requiresSubmission: !!a.requiresSubmission });
    setActivityModal('edit');
  };
  const saveActivity = async () => {
    if (!activityForm.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (activityModal === 'add') {
        await apiFetch('/learning-activities', {
          method: 'POST',
          body: JSON.stringify({
            type: manageType,
            title: activityForm.title,
            titleFr: activityForm.titleFr,
            description: activityForm.description,
            requiresSubmission: activityForm.requiresSubmission,
          }),
          requireAuth: true,
        });
      } else if (editingActivity) {
        await apiFetch(`/learning-activities/${editingActivity.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: activityForm.title,
            titleFr: activityForm.titleFr,
            description: activityForm.description,
            requiresSubmission: activityForm.requiresSubmission,
          }),
          requireAuth: true,
        });
      }
      setActivityModal(null);
      loadActivitiesList();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };
  const deleteActivity = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette activité ?' : 'Delete this activity?')) return;
    try {
      await apiFetch(`/learning-activities/${id}`, { method: 'DELETE', requireAuth: true });
      loadActivitiesList();
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };
  const openAssign = async (a: ActivityListItem) => {
    setAssignModal(a);
    setAssignedScheduleIds([]);
    setInitialAssignedIds([]);
    try {
      const [schedRes, slotsRes] = await Promise.all([
        apiFetch(`/learning-activities/${a.id}/schedules`, { requireAuth: true }),
        apiFetch('/staff/my-schedule/slots?weeks=4', { requireAuth: true }),
      ]);
      const list = (schedRes.schedules || []) as { scheduleId: string }[];
      setAssignedScheduleIds(list.map((s) => s.scheduleId));
      setInitialAssignedIds(list.map((s) => s.scheduleId));
      setMyScheduleSlots(slotsRes.slots || []);
    } catch (_) {
      setMyScheduleSlots([]);
    }
  };
  const toggleAssignSlot = (scheduleId: string) => {
    setAssignedScheduleIds((prev) =>
      prev.includes(scheduleId) ? prev.filter((id) => id !== scheduleId) : [...prev, scheduleId]
    );
  };
  const saveAssign = async () => {
    if (!assignModal) return;
    setSaving(true);
    setError('');
    try {
      const toRemove = initialAssignedIds.filter((id) => !assignedScheduleIds.includes(id));
      const toAdd = assignedScheduleIds.filter((id) => !initialAssignedIds.includes(id));
      for (const id of toRemove) {
        await apiFetch(`/learning-activities/${assignModal.id}/schedules/${id}`, { method: 'DELETE', requireAuth: true });
      }
      for (const id of toAdd) {
        await apiFetch(`/learning-activities/${assignModal.id}/schedules`, {
          method: 'POST',
          body: JSON.stringify({ scheduleId: id }),
          requireAuth: true,
        });
      }
      setAssignModal(null);
      loadActivitiesList();
      if (tab === 'activities') loadMyActivities();
    } catch (e: any) {
      setError(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Exercices, évaluations et devoirs' : 'Exercises, assessments & assignments'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {lang === 'fr' ? 'Liés aux créneaux (cours) qui vous sont assignés. Préparation de leçon reste dans Emploi du temps & Présences.' : 'Linked to the class events (schedule slots) assigned to you. Lesson preparation stays in Schedule & Attendance.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        <button
          onClick={() => setTab('activities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'activities' ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          style={tab === 'activities' ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
        >
          <BookOpen size={18} />
          {lang === 'fr' ? 'Mes activités par créneau' : 'My activities by slot'}
        </button>
        <button
          onClick={() => setTab('manage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'manage' ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          style={tab === 'manage' ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
        >
          <Plus size={18} />
          {lang === 'fr' ? 'Créer / gérer' : 'Create & manage'}
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'submissions' ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          style={tab === 'submissions' ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
        >
          <ClipboardCheck size={18} />
          {lang === 'fr' ? 'Soumissions à noter' : 'Submissions to grade'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : tab === 'manage' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['exercise', 'assessment', 'assignment'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setManageType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${manageType === type ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                style={manageType === type ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
              >
                {type === 'exercise' && (lang === 'fr' ? 'Exercices' : 'Exercises')}
                {type === 'assessment' && (lang === 'fr' ? 'Évaluations / Quiz' : 'Assessments / Quizzes')}
                {type === 'assignment' && (lang === 'fr' ? 'Devoirs' : 'Assignments')}
              </button>
            ))}
            <button
              onClick={openAddActivity}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: 'var(--btc-primary,#2E8B57)' }}
            >
              <Plus size={16} /> {lang === 'fr' ? 'Créer' : 'Create new'}
            </button>
          </div>
          <div className="space-y-2">
            {activitiesList.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                {lang === 'fr' ? 'Aucune activité. Cliquez sur « Créer » pour en ajouter.' : 'No activities. Click « Create new » to add one.'}
              </div>
            ) : (
              activitiesList.map((a) => {
                const isMine = myUserId && a.createdBy === myUserId;
                return (
                  <motion.div
                    key={a.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{lang === 'fr' && a.titleFr ? a.titleFr : a.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{a.description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMine && (
                        <button onClick={() => openEditActivity(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={lang === 'fr' ? 'Modifier' : 'Edit'}><Edit2 size={18} /></button>
                      )}
                      <button onClick={() => openAssign(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={lang === 'fr' ? 'Assigner à mon créneau' : 'Assign to my slot'}><CalendarCheck size={18} /></button>
                      {isMine && (
                        <button onClick={() => deleteActivity(a.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      ) : tab === 'activities' ? (
        <div className="space-y-4">
          {slots.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>{lang === 'fr' ? 'Aucune activité assignée à vos créneaux. Créez-en dans « Créer / gérer » et assignez-les à vos créneaux.' : 'No activities assigned to your slots. Create some in « Create & manage » and assign them to your class events.'}</p>
            </div>
          ) : (
            slots.map((slot, i) => (
              <motion.div
                key={slot.scheduleId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,139,87,0.15)' }}>
                    <Calendar size={18} style={{ color: 'var(--btc-primary,#2E8B57)' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{slot.className ?? '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {slot.weekStart} · {DAY_LABELS[(slot.dayOfWeek || 1) - 1] ?? slot.dayOfWeek} {slot.startTime}–{slot.endTime}
                      {slot.room ? ` · ${slot.room}` : ''}
                      {slot.lessonTitle ? ` · ${slot.lessonTitle}` : ''}
                    </p>
                  </div>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {slot.activities.length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucune activité' : 'No activities'}</span>
                  ) : (
                    slot.activities.map((act) => (
                      <span
                        key={act.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                      >
                        <BookOpen size={14} />
                        {lang === 'fr' && act.titleFr ? act.titleFr : act.title}
                        {act.requiresSubmission && <span className="text-xs text-amber-600 dark:text-amber-400">· submit</span>}
                      </span>
                    ))
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-40" />
              <p>{lang === 'fr' ? 'Aucune soumission à noter.' : 'No submissions to grade.'}</p>
            </div>
          ) : (
            submissions.map((s) => (
              <motion.div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.studentName || s.studentEmail || '—'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lang === 'fr' && s.activityTitleFr ? s.activityTitleFr : s.activityTitle} · {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}
                  </p>
                </div>
                <button
                  onClick={() => openGrade(s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                  style={{ background: 'var(--btc-primary,#2E8B57)' }}
                >
                  <CheckCircle size={16} /> {lang === 'fr' ? 'Noter' : 'Grade'}
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit activity modal */}
      {activityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setActivityModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>
              {activityModal === 'add' ? (lang === 'fr' ? 'Créer' : 'Create') : (lang === 'fr' ? 'Modifier' : 'Edit')} — {manageType === 'exercise' && (lang === 'fr' ? 'Exercice' : 'Exercise')}{manageType === 'assessment' && (lang === 'fr' ? 'Évaluation' : 'Assessment')}{manageType === 'assignment' && (lang === 'fr' ? 'Devoir' : 'Assignment')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre' : 'Title'} *</label>
                <input value={activityForm.title} onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Description' : 'Description'}</label>
                <textarea value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              {(manageType === 'assignment' || editingActivity?.requiresSubmission) && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={activityForm.requiresSubmission} onChange={e => setActivityForm(f => ({ ...f, requiresSubmission: e.target.checked }))} className="rounded" />
                  {lang === 'fr' ? 'Soumission requise (à noter)' : 'Requires submission (to grade)'}
                </label>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setActivityModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={saveActivity} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign to my slot modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAssignModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{lang === 'fr' ? 'Assigner à mon créneau' : 'Assign to my class event'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{assignModal.title}</p>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {myScheduleSlots.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucun créneau assigné pour les 4 prochaines semaines.' : 'No schedule slots assigned for the next 4 weeks.'}</p>
              ) : (
                myScheduleSlots.map((slot) => (
                  <label key={slot.scheduleId} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={assignedScheduleIds.includes(slot.scheduleId)} onChange={() => toggleAssignSlot(slot.scheduleId)} className="rounded" />
                    {slot.className} — {slot.weekStart} {DAY_LABELS[(slot.dayOfWeek || 1) - 1] ?? slot.dayOfWeek} {slot.startTime}–{slot.endTime}
                  </label>
                ))
              )}
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setAssignModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={saveAssign} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grade modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setGradeModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>{lang === 'fr' ? 'Noter' : 'Grade'} — {gradeModal.studentName || gradeModal.studentEmail}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{lang === 'fr' && gradeModal.activityTitleFr ? gradeModal.activityTitleFr : gradeModal.activityTitle}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Score' : 'Score'}</label>
                <input type="number" step={0.01} value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Commentaire' : 'Feedback'}</label>
                <textarea value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setGradeModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={saveGrade} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
