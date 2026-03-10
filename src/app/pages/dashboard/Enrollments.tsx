import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Loader2, CheckCircle, Filter, X, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { ExportReportButton } from '../../components/ExportReportButton';

interface EnrollmentProgress {
  amountPaid: number;
  totalAmount: number;
  learningPercent: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  assessmentScore: number | null;
  assessmentMax: number;
  assignmentStatus: string;
  assignmentScore: number | null;
}

interface Enrollment {
  id: string;
  studentId: string;
  programId: string;
  promotionId: string;
  rollNumber?: string;
  status: string;
  enrolledAt: string;
  studentName?: string;
  studentEmail?: string;
  progName?: string;
  progNameFr?: string;
  promoName?: string;
  promoNameFr?: string;
  startDate?: string;
  endDate?: string;
  totalAmountToPay: number;
  progress?: EnrollmentProgress;
}

const STATUS_LABELS: Record<string, { en: string; fr: string }> = {
  pending: { en: 'Pending approval', fr: 'En attente' },
  active: { en: 'Active', fr: 'Actif' },
  completed: { en: 'Completed', fr: 'Terminé' },
  dropped: { en: 'Dropped', fr: 'Abandonné' },
  suspended: { en: 'Suspended', fr: 'Suspendu' },
};

interface PromotionOption {
  id: string;
  name: string;
  nameFr?: string;
}
interface ProgramOption {
  id: string;
  name: string;
  nameFr?: string;
  departmentId?: string;
  department?: string;
}
interface DepartmentOption {
  id: string;
  name: string;
  name_fr?: string;
  slug: string;
}

export function Enrollments() {
  const { lang } = useLanguage();
  const [list, setList] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [promotionFilter, setPromotionFilter] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progressModal, setProgressModal] = useState<Enrollment | null>(null);
  const [progressForm, setProgressForm] = useState<EnrollmentProgress>({
    amountPaid: 0, totalAmount: 0, learningPercent: 0, exercisesCompleted: 0, exercisesTotal: 0,
    assessmentScore: null, assessmentMax: 100, assignmentStatus: 'not_started', assignmentScore: null,
  });
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [promData, progData, deptData] = await Promise.all([
          apiFetch('/promotions', { requireAuth: true }),
          apiFetch('/programs', { requireAuth: true }),
          apiFetch('/departments', { requireAuth: true }),
        ]);
        setPromotions(promData.promotions || []);
        setPrograms(progData.programs || []);
        setDepartments(deptData.departments || []);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    load();
  }, [statusFilter, promotionFilter, programFilter, departmentFilter]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (promotionFilter) params.set('promotionId', promotionFilter);
      if (programFilter) params.set('programId', programFilter);
      if (departmentFilter) params.set('departmentId', departmentFilter);
      const url = params.toString() ? `/enrollments?${params.toString()}` : '/enrollments';
      const data = await apiFetch(url, { requireAuth: true });
      setList(data.enrollments || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setApprovingId(id);
    setError('');
    try {
      await apiFetch(`/enrollments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
        requireAuth: true,
      });
      setList(prev => prev.map(e => e.id === id ? { ...e, status: 'active' } : e));
    } catch (e: any) {
      setError(e.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const openProgressModal = (e: Enrollment) => {
    setProgressModal(e);
    const p = e.progress ?? {
      amountPaid: 0, totalAmount: e.totalAmountToPay ?? 0, learningPercent: 0, exercisesCompleted: 0, exercisesTotal: 0,
      assessmentScore: null, assessmentMax: 100, assignmentStatus: 'not_started', assignmentScore: null,
    };
    setProgressForm({
      amountPaid: p.amountPaid ?? 0,
      totalAmount: p.totalAmount ?? e.totalAmountToPay ?? 0,
      learningPercent: p.learningPercent ?? 0,
      exercisesCompleted: p.exercisesCompleted ?? 0,
      exercisesTotal: p.exercisesTotal ?? 0,
      assessmentScore: p.assessmentScore ?? null,
      assessmentMax: p.assessmentMax ?? 100,
      assignmentStatus: p.assignmentStatus ?? 'not_started',
      assignmentScore: p.assignmentScore ?? null,
    });
  };

  const saveProgress = async () => {
    if (!progressModal) return;
    setSavingProgress(true);
    setError('');
    try {
      const body = {
        amountPaid: progressForm.amountPaid,
        totalAmount: progressForm.totalAmount,
        learningPercent: progressForm.learningPercent,
        exercisesCompleted: progressForm.exercisesCompleted,
        exercisesTotal: progressForm.exercisesTotal,
        assessmentScore: progressForm.assessmentScore,
        assessmentMax: progressForm.assessmentMax,
        assignmentStatus: progressForm.assignmentStatus,
        assignmentScore: progressForm.assignmentScore,
      };
      const data = await apiFetch(`/enrollments/${progressModal.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        requireAuth: true,
      });
      setList(prev => prev.map(e => e.id === progressModal.id ? { ...e, progress: data.progress } : e));
      setProgressModal(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Inscriptions' : 'Enrollments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr' ? 'Approuvez les inscriptions lorsque l’étudiant a payé.' : 'Approve enrollments when the student has paid.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportReportButton
            data={list.map(e => ({
              Student: e.studentName ?? '',
              Email: e.studentEmail ?? '',
              Program: lang === 'fr' ? (e.progNameFr ?? e.progName) : e.progName,
              Promotion: lang === 'fr' ? (e.promoNameFr ?? e.promoName) : e.promoName,
              Status: e.status,
              'Enrolled at': e.enrolledAt,
              'Roll no.': e.rollNumber ?? '',
            }))}
            filename="enrollments"
            compact
          />
          <Filter size={18} className="text-gray-500 shrink-0" />
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[140px]"
            title={lang === 'fr' ? 'Département' : 'Department'}
          >
            <option value="">{lang === 'fr' ? 'Tous les départements' : 'All departments'}</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{lang === 'fr' ? (d.name_fr || d.name) : d.name}</option>
            ))}
          </select>
          <select
            value={promotionFilter}
            onChange={e => setPromotionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[140px]"
            title={lang === 'fr' ? 'Promotion' : 'Promotion'}
          >
            <option value="">{lang === 'fr' ? 'Toutes les promotions' : 'All promotions'}</option>
            {promotions.map(p => (
              <option key={p.id} value={p.id}>{lang === 'fr' ? (p.nameFr || p.name) : p.name}</option>
            ))}
          </select>
          <select
            value={programFilter}
            onChange={e => setProgramFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[140px]"
            title={lang === 'fr' ? 'Programme' : 'Program'}
          >
            <option value="">{lang === 'fr' ? 'Tous les programmes' : 'All programs'}</option>
            {programs
              .filter(prog => !departmentFilter || prog.departmentId === departmentFilter)
              .map(p => (
                <option key={p.id} value={p.id}>{lang === 'fr' ? (p.nameFr || p.name) : p.name}</option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[120px]"
          >
            <option value="pending">{lang === 'fr' ? 'En attente' : 'Pending'}</option>
            <option value="active">{lang === 'fr' ? 'Actifs' : 'Active'}</option>
            <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
            <option value="completed">{lang === 'fr' ? 'Terminés' : 'Completed'}</option>
            <option value="dropped">{lang === 'fr' ? 'Abandonnés' : 'Dropped'}</option>
            <option value="suspended">{lang === 'fr' ? 'Suspendus' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          {statusFilter === 'pending'
            ? (lang === 'fr' ? 'Aucune inscription en attente.' : 'No pending enrollments.')
            : (lang === 'fr' ? 'Aucune inscription.' : 'No enrollments.')}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <motion.div
              key={e.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30 shrink-0">
                  <UserCheck size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {e.studentName || e.studentEmail || e.studentId}
                    </p>
                    {e.rollNumber && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" title={lang === 'fr' ? 'Numéro de rôle' : 'Roll number'}>
                        {e.rollNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {e.studentEmail}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {lang === 'fr' ? (e.progNameFr || e.progName) : e.progName} · {lang === 'fr' ? (e.promoNameFr || e.promoName) : e.promoName}
                    {' · '}{formatDate(e.startDate)} → {formatDate(e.endDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Total à payer' : 'Total to pay'}: <strong>${e.totalAmountToPay}</strong>
                    {e.progress && (
                      <> · Paid ${e.progress.amountPaid} · Learning {e.progress.learningPercent}%</>
                    )}
                    {' · '}{formatDate(e.enrolledAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => openProgressModal(e)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TrendingUp size={14} />
                  {lang === 'fr' ? 'Progrès' : 'Progress'}
                </button>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  e.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                  e.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  e.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {STATUS_LABELS[e.status]?.[lang === 'fr' ? 'fr' : 'en'] || e.status}
                </span>
                {e.status === 'pending' && (
                  <button
                    onClick={() => approve(e.id)}
                    disabled={approvingId === e.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {approvingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {lang === 'fr' ? 'Approuver' : 'Approve'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress modal */}
      {progressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setProgressModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                {lang === 'fr' ? 'Progrès' : 'Progress'} — {progressModal.studentName || progressModal.studentEmail}
              </h3>
              <button onClick={() => setProgressModal(null)} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Montant payé' : 'Amount paid'}</label>
                  <input type="number" min={0} step={0.01} value={progressForm.amountPaid} onChange={e => setProgressForm(f => ({ ...f, amountPaid: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Total' : 'Total'}</label>
                  <input type="number" min={0} step={0.01} value={progressForm.totalAmount} onChange={e => setProgressForm(f => ({ ...f, totalAmount: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Apprentissage %' : 'Learning %'}</label>
                <input type="number" min={0} max={100} value={progressForm.learningPercent} onChange={e => setProgressForm(f => ({ ...f, learningPercent: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Exercices complétés' : 'Exercises completed'}</label>
                  <input type="number" min={0} value={progressForm.exercisesCompleted} onChange={e => setProgressForm(f => ({ ...f, exercisesCompleted: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Total exercices' : 'Exercises total'}</label>
                  <input type="number" min={0} value={progressForm.exercisesTotal} onChange={e => setProgressForm(f => ({ ...f, exercisesTotal: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Score évaluation' : 'Assessment score'}</label>
                  <input type="number" min={0} step={0.01} value={progressForm.assessmentScore ?? ''} onChange={e => setProgressForm(f => ({ ...f, assessmentScore: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" placeholder="—" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Max' : 'Max'}</label>
                  <input type="number" min={0} value={progressForm.assessmentMax} onChange={e => setProgressForm(f => ({ ...f, assessmentMax: Number(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Devoir' : 'Assignment'}</label>
                  <select value={progressForm.assignmentStatus} onChange={e => setProgressForm(f => ({ ...f, assignmentStatus: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                    <option value="not_started">{lang === 'fr' ? 'Non commencé' : 'Not started'}</option>
                    <option value="in_progress">{lang === 'fr' ? 'En cours' : 'In progress'}</option>
                    <option value="submitted">{lang === 'fr' ? 'Soumis' : 'Submitted'}</option>
                    <option value="graded">{lang === 'fr' ? 'Noté' : 'Graded'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Note devoir' : 'Assignment score'}</label>
                  <input type="number" min={0} step={0.01} value={progressForm.assignmentScore ?? ''} onChange={e => setProgressForm(f => ({ ...f, assignmentScore: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" placeholder="—" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setProgressModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={saveProgress} disabled={savingProgress} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {savingProgress ? <Loader2 size={14} className="animate-spin" /> : null}
                {lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
