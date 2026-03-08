import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Loader2, Plus, X, Edit2, Trash2, ListOrdered, Share2, CheckCircle,
  FileQuestion, Video, Music, Headphones, FileText, ToggleLeft, Link2, Type
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

type ActivityType = 'exercise' | 'assessment' | 'assignment';
type ItemType = 'multiple_choice' | 'theoretical' | 'video' | 'audio' | 'listening' | 'reading' | 'true_false' | 'matching' | 'fill_blank';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  titleFr?: string;
  description?: string;
  programId?: string;
  programName?: string;
  requiresSubmission?: boolean;
  maxScore?: number;
  createdAt?: string;
}

interface ActivityItem {
  id: string;
  activityId: string;
  sortOrder: number;
  itemType: ItemType;
  questionText: string;
  questionTextFr?: string;
  options?: { id: string; text: string; correct?: boolean }[];
  correctAnswer?: unknown;
  mediaUrl?: string;
  mediaType?: string;
  maxScore: number;
}

interface Submission {
  id: string;
  enrollmentId: string;
  activityId: string;
  status: string;
  submittedAt?: string;
  score?: number | null;
  maxScore?: number | null;
  feedback?: string;
  studentName?: string;
  studentEmail?: string;
  activityTitle?: string;
}

const ITEM_TYPES: { id: ItemType; icon: typeof FileQuestion }[] = [
  { id: 'multiple_choice', icon: ListOrdered },
  { id: 'theoretical', icon: FileText },
  { id: 'video', icon: Video },
  { id: 'audio', icon: Music },
  { id: 'listening', icon: Headphones },
  { id: 'reading', icon: BookOpen },
  { id: 'true_false', icon: ToggleLeft },
  { id: 'matching', icon: Link2 },
  { id: 'fill_blank', icon: Type },
];

export function LearningActivities() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<'exercise' | 'assessment' | 'assignment' | 'submissions'>('exercise');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [promotions, setPromotions] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityModal, setActivityModal] = useState<'add' | 'edit' | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState({ title: '', titleFr: '', description: '', programId: '' as string, requiresSubmission: false });
  const [itemsModal, setItemsModal] = useState<Activity | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [newItem, setNewItem] = useState<{ itemType: ItemType; questionText: string; questionTextFr: string; options: string; maxScore: number; mediaUrl: string }>({
    itemType: 'multiple_choice', questionText: '', questionTextFr: '', options: '', maxScore: 1, mediaUrl: '',
  });
  const [addingItem, setAddingItem] = useState(false);
  const [promoModal, setPromoModal] = useState<Activity | null>(null);
  const [assignedPromoIds, setAssignedPromoIds] = useState<string[]>([]);
  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '' as string | number, feedback: '' });
  const [saving, setSaving] = useState(false);

  const activityType = tab === 'submissions' ? null : (tab as ActivityType);

  useEffect(() => {
    loadPrograms();
    loadPromotions();
  }, []);
  useEffect(() => {
    if (activityType) loadActivities();
    else loadSubmissions();
  }, [tab, activityType]);

  const loadPrograms = async () => {
    try {
      const d = await apiFetch('/programs', { requireAuth: true });
      setPrograms(d.programs || []);
    } catch (_) {}
  };
  const loadPromotions = async () => {
    try {
      const d = await apiFetch('/promotions', { requireAuth: true });
      setPromotions(d.promotions || []);
    } catch (_) {}
  };
  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const url = activityType ? `/learning-activities?type=${activityType}` : '/learning-activities';
      const d = await apiFetch(url, { requireAuth: true });
      setActivities(d.activities || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };
  const loadSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch('/activity-submissions?status=submitted', { requireAuth: true });
      setSubmissions(d.submissions || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingActivity(null);
    setActivityForm({ title: '', titleFr: '', description: '', programId: programs[0]?.id || '', requiresSubmission: tab === 'assignment' });
    setActivityModal('add');
  };
  const openEdit = (a: Activity) => {
    setEditingActivity(a);
    setActivityForm({
      title: a.title,
      titleFr: a.titleFr || '',
      description: a.description || '',
      programId: a.programId || '',
      requiresSubmission: !!a.requiresSubmission,
    });
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
            type: activityType,
            title: activityForm.title,
            titleFr: activityForm.titleFr,
            description: activityForm.description,
            programId: activityForm.programId || undefined,
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
            programId: activityForm.programId || undefined,
            requiresSubmission: activityForm.requiresSubmission,
          }),
          requireAuth: true,
        });
      }
      setActivityModal(null);
      loadActivities();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openItems = async (a: Activity) => {
    setItemsModal(a);
    setNewItem({ itemType: 'multiple_choice', questionText: '', questionTextFr: '', options: '', maxScore: 1, mediaUrl: '' });
    try {
      const d = await apiFetch(`/learning-activities/${a.id}/items`, { requireAuth: true });
      setItems(d.items || []);
    } catch (_) {
      setItems([]);
    }
  };
  const addItem = async () => {
    if (!itemsModal || !newItem.questionText.trim()) return;
    setAddingItem(true);
    setError('');
    try {
      let options: { id: string; text: string; correct?: boolean }[] = [];
      if (newItem.itemType === 'multiple_choice' && newItem.options.trim()) {
        options = newItem.options.split('\n').map((line, i) => {
          const t = line.replace(/^\s*[-*]\s*/, '').trim();
          const correct = /^\s*[*✓√]\s*/i.test(line) || line.includes('(correct)');
          return { id: String.fromCharCode(97 + i), text: t, correct };
        }).filter(o => o.text);
      }
      await apiFetch(`/learning-activities/${itemsModal.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          itemType: newItem.itemType,
          questionText: newItem.questionText,
          questionTextFr: newItem.questionTextFr,
          options: options.length ? options : undefined,
          mediaUrl: newItem.mediaUrl || undefined,
          maxScore: newItem.maxScore,
        }),
        requireAuth: true,
      });
      const d = await apiFetch(`/learning-activities/${itemsModal.id}/items`, { requireAuth: true });
      setItems(d.items || []);
      setNewItem({ itemType: 'multiple_choice', questionText: '', questionTextFr: '', options: '', maxScore: 1, mediaUrl: '' });
    } catch (e: any) {
      setError(e.message || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };
  const deleteItem = async (activityId: string, itemId: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette question ?' : 'Delete this item?')) return;
    try {
      await apiFetch(`/learning-activities/${activityId}/items/${itemId}`, { method: 'DELETE', requireAuth: true });
      if (itemsModal?.id === activityId) {
        setItems(prev => prev.filter(i => i.id !== itemId));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };
  const openPromo = async (a: Activity) => {
    setPromoModal(a);
    try {
      const d = await apiFetch(`/learning-activities/${a.id}/promotions`, { requireAuth: true });
      setAssignedPromoIds(d.promotionIds || []);
    } catch (_) {
      setAssignedPromoIds([]);
    }
  };
  const savePromo = async () => {
    if (!promoModal) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/learning-activities/${promoModal.id}/promotions`, {
        method: 'POST',
        body: JSON.stringify({ promotionIds: assignedPromoIds }),
        requireAuth: true,
      });
      setPromoModal(null);
    } catch (e: any) {
      setError(e.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const deleteActivity = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette activité ?' : 'Delete this activity?')) return;
    try {
      await apiFetch(`/learning-activities/${id}`, { method: 'DELETE', requireAuth: true });
      loadActivities();
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };

  const openGrade = (s: Submission) => {
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
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {(['exercise', 'assessment', 'assignment', 'submissions'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === tabKey ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            style={tab === tabKey ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
          >
            {tabKey === 'exercise' && t('learning.exercises')}
            {tabKey === 'assessment' && t('learning.assessments')}
            {tabKey === 'assignment' && t('learning.assignments')}
            {tabKey === 'submissions' && t('learning.submissions')}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {tab !== 'submissions' && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
            {tab === 'exercise' && t('learning.exercises')}
            {tab === 'assessment' && t('learning.assessments')}
            {tab === 'assignment' && t('learning.assignments')}
          </h2>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--btc-primary,#2E8B57)' }}
          >
            <Plus size={18} /> {t('learning.addActivity')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : tab === 'submissions' ? (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              {t('learning.submitted')} — none to grade.
            </div>
          ) : (
            submissions.map((s) => (
              <motion.div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.studentName || s.studentEmail}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.activityTitle} · {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}</p>
                </div>
                <button onClick={() => openGrade(s)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                  <CheckCircle size={16} /> {t('learning.grade')}
                </button>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              No activities yet. Click “{t('learning.addActivity')}” to create one.
            </div>
          ) : (
            activities.map((a) => (
              <motion.div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{lang === 'fr' && a.titleFr ? a.titleFr : a.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {a.programName || '—'} {a.requiresSubmission && ' · ' + (lang === 'fr' ? 'Soumission requise' : 'Requires submission')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={t('common.edit')}><Edit2 size={18} /></button>
                  <button onClick={() => openItems(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={t('learning.manageItems')}><ListOrdered size={18} /></button>
                  <button onClick={() => openPromo(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={t('learning.assignToPromotions')}><Share2 size={18} /></button>
                  <button onClick={() => deleteActivity(a.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Activity modal */}
      {activityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setActivityModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>{activityModal === 'add' ? t('learning.addActivity') : t('common.edit')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre' : 'Title'} *</label>
                <input value={activityForm.title} onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre (FR)' : 'Title (FR)'}</label>
                <input value={activityForm.titleFr} onChange={e => setActivityForm(f => ({ ...f, titleFr: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Description' : 'Description'}</label>
                <textarea value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Programme' : 'Program'}</label>
                <select value={activityForm.programId} onChange={e => setActivityForm(f => ({ ...f, programId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">—</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>)}
                </select>
              </div>
              {(tab === 'assignment' || editingActivity?.requiresSubmission) && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={activityForm.requiresSubmission} onChange={e => setActivityForm(f => ({ ...f, requiresSubmission: e.target.checked }))} className="rounded" />
                  {t('learning.requiresSubmission')}
                </label>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setActivityModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{t('common.cancel')}</button>
              <button onClick={saveActivity} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Items modal */}
      {itemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setItemsModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{t('learning.manageItems')} — {itemsModal.title}</h3>
              <button onClick={() => setItemsModal(null)} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Add item form */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{lang === 'fr' ? 'Ajouter une question' : 'Add question'}</h4>
                <select value={newItem.itemType} onChange={e => setNewItem(f => ({ ...f, itemType: e.target.value as ItemType }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  {ITEM_TYPES.map(opt => <option key={opt.id} value={opt.id}>{t(`learning.itemTypes.${opt.id}`)}</option>)}
                </select>
                <input placeholder={lang === 'fr' ? 'Question *' : 'Question *'} value={newItem.questionText} onChange={e => setNewItem(f => ({ ...f, questionText: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                {(newItem.itemType === 'video' || newItem.itemType === 'audio' || newItem.itemType === 'listening' || newItem.itemType === 'reading') && (
                  <input placeholder="Media URL" value={newItem.mediaUrl} onChange={e => setNewItem(f => ({ ...f, mediaUrl: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                )}
                {newItem.itemType === 'multiple_choice' && (
                  <textarea placeholder={lang === 'fr' ? 'Une option par ligne; préfixer par * ou (correct) pour la bonne réponse' : 'One option per line; prefix with * or (correct) for correct answer'} value={newItem.options} onChange={e => setNewItem(f => ({ ...f, options: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                )}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Points' : 'Points'}</label>
                  <input type="number" min={0} step={0.5} value={newItem.maxScore} onChange={e => setNewItem(f => ({ ...f, maxScore: Number(e.target.value) || 0 }))} className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                </div>
                <button onClick={addItem} disabled={addingItem || !newItem.questionText.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50">
                  {addingItem && <Loader2 size={14} className="animate-spin" />}<Plus size={14} /> {lang === 'fr' ? 'Ajouter' : 'Add'}
                </button>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{lang === 'fr' ? 'Questions' : 'Items'}</h4>
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0">{t(`learning.itemTypes.${i.itemType}`)}</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{i.questionText || '—'}</span>
                    <span className="text-xs text-gray-500 shrink-0">{i.maxScore} pt(s)</span>
                    <button onClick={() => deleteItem(itemsModal.id, i.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No items yet. Add one above.</p>}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign promotions modal */}
      {promoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPromoModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>{t('learning.assignToPromotions')} — {promoModal.title}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {promotions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={assignedPromoIds.includes(p.id)}
                    onChange={e => {
                      if (e.target.checked) setAssignedPromoIds(prev => [...prev, p.id]);
                      else setAssignedPromoIds(prev => prev.filter(id => id !== p.id));
                    }}
                    className="rounded"
                  />
                  {lang === 'fr' && p.nameFr ? p.nameFr : p.name}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPromoModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{t('common.cancel')}</button>
              <button onClick={savePromo} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grade modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setGradeModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>{t('learning.grade')} — {gradeModal.studentName || gradeModal.studentEmail}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{gradeModal.activityTitle}</p>
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
              <button onClick={() => setGradeModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{t('common.cancel')}</button>
              <button onClick={saveGrade} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
