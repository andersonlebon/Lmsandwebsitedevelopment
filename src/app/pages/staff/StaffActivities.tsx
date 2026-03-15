import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ClipboardCheck, Loader2, CheckCircle, Calendar, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StaffActivities() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<'activities' | 'submissions'>('activities');
  const [slots, setSlots] = useState<SlotActivity[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionToGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState<SubmissionToGrade | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '' as string | number, feedback: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab === 'activities') loadMyActivities();
    else loadSubmissions();
  }, [tab]);

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
      ) : tab === 'activities' ? (
        <div className="space-y-4">
          {slots.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>{lang === 'fr' ? 'Aucune activité assignée à vos créneaux. L\'admin assigne les exercices/évaluations/devoirs aux créneaux dans Académique → Exercices & Évaluations.' : 'No activities assigned to your slots. Admin assigns exercises/assessments/assignments to class events in Academic → Exercises & Assessments.'}</p>
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
