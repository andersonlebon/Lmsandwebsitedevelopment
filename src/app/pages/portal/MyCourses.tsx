import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { BookOpen, Play, Loader2, DollarSign, GraduationCap, ClipboardCheck, FileCheck, Send } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useMyEnrollments } from '../../hooks/useBTC';
import type { Enrollment, EnrollmentProgress } from '../../hooks/useBTC';

function getProgress(e: Enrollment): EnrollmentProgress | null {
  const p = e.progress;
  if (!p || typeof p === 'number') return null;
  return p as EnrollmentProgress;
}

function assignmentLabel(status: string, t: (k: string) => string): string {
  switch (status) {
    case 'submitted': return t('progress.submitted');
    case 'graded': return t('progress.graded');
    case 'in_progress': return t('progress.inProgress');
    default: return t('progress.notStarted');
  }
}

export function PortalMyCourses() {
  const { t, lang } = useLanguage();
  const { enrollments, isLoading } = useMyEnrollments();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeEnrollments = enrollments.filter((e: Enrollment) => e.status === 'active' || e.status === 'pending');
  const selected = activeId && activeEnrollments.find((e: Enrollment) => e.id === activeId);
  const firstId = activeEnrollments[0]?.id ?? null;
  const displayId = selected?.id ?? firstId;
  const displayEnr = displayId ? activeEnrollments.find((e: Enrollment) => e.id === displayId) : null;
  const progress = displayEnr ? getProgress(displayEnr) : null;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (activeEnrollments.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">0 enrolled</p>
        </div>
        <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('progress.noEnrollments')}</p>
          <Link to="/register" className="text-sm font-medium mt-2 inline-block" style={{ color: 'var(--btc-primary,#16a34a)' }}>
            {t('progress.browsePrograms')} →
          </Link>
        </div>
      </div>
    );
  }

  const progName = (e: Enrollment) => (lang === 'fr' && e.progNameFr ? e.progNameFr : e.progName) || '';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>My Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{activeEnrollments.length} enrolled</p>
      </div>

      {/* Enrollment tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeEnrollments.map((e: Enrollment) => (
          <button
            key={e.id}
            onClick={() => setActiveId(e.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              displayId === e.id ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            style={displayId === e.id ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
          >
            <BookOpen size={15} />
            {progName(e)}
          </button>
        ))}
      </div>

      {/* Selected enrollment detail + progress */}
      {displayEnr && (
        <motion.div key={displayEnr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.15)' }}>
                <BookOpen size={28} style={{ color: 'var(--btc-primary,#2E8B57)' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{progName(displayEnr)}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{displayEnr.promoName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {displayEnr.startDate && displayEnr.endDate && `${new Date(displayEnr.startDate).toLocaleDateString()} – ${new Date(displayEnr.endDate).toLocaleDateString()}`}
                  {!displayEnr.startDate && '—'}
                </p>
                <Link
                  to={`/portal/courses/${displayEnr.programId}`}
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-white text-xs font-medium hover:opacity-90 transition-all"
                  style={{ background: 'var(--btc-primary,#2E8B57)' }}
                >
                  <Play size={13} /> Open course
                </Link>
              </div>
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--btc-primary,#2E8B57)" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - (progress?.learningPercent ?? 0) / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: 'var(--btc-primary,#2E8B57)', fontFamily: 'Poppins' }}>{progress?.learningPercent ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{t('progress.myProgress')}</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Payment */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-900/30">
                  <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('progress.payment')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ${progress?.amountPaid ?? 0} {t('progress.paidOf')} ${progress?.totalAmount ?? displayEnr.totalAmountToPay ?? 0}
                  </p>
                </div>
                <div className="h-2 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${(() => { const total = progress?.totalAmount ?? displayEnr.totalAmountToPay ?? 0; return total > 0 ? Math.min(100, ((progress?.amountPaid ?? 0) / total) * 100) : 0; })()}%` }}
                  />
                </div>
              </div>
              {/* Learning */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/30">
                  <GraduationCap size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('progress.learning')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{progress?.learningPercent ?? 0}%</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress?.learningPercent ?? 0}%` }} />
                </div>
              </div>
              {/* Exercises */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/30">
                  <ClipboardCheck size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('progress.exercises')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{progress?.exercisesCompleted ?? 0} / {progress?.exercisesTotal || 0}</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${(progress?.exercisesTotal ?? 0) > 0 ? ((progress?.exercisesCompleted ?? 0) / (progress?.exercisesTotal ?? 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {/* Assessment */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-100 dark:bg-purple-900/30">
                  <FileCheck size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('progress.assessment')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {progress?.assessmentScore != null ? `${progress.assessmentScore} / ${progress.assessmentMax ?? 100}` : '—'}
                  </p>
                </div>
              </div>
              {/* Assignment */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-900/30">
                  <Send size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('progress.assignment')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {assignmentLabel(progress?.assignmentStatus ?? 'not_started', t)}
                    {progress?.assignmentScore != null ? ` — ${progress.assignmentScore}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
