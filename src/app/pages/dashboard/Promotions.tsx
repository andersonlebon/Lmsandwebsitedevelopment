import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Plus, Edit2, Trash2, X, Loader2, ChevronDown, ChevronUp, Clock, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { ExportReportButton } from '../../components/ExportReportButton';

const DURATION_UNITS = [
  { id: 'days', en: 'Days', fr: 'Jours' },
  { id: 'weeks', en: 'Weeks', fr: 'Semaines' },
  { id: 'months', en: 'Months', fr: 'Mois' },
  { id: 'trimestre', en: 'Term', fr: 'Trimestre' },
];

const STATUS_OPTIONS = [
  { id: 'upcoming', en: 'Upcoming', fr: 'À venir' },
  { id: 'active', en: 'Active', fr: 'Active' },
  { id: 'ended', en: 'Ended', fr: 'Terminée' },
];

const DAY_OPTIONS: { value: string; en: string; fr: string }[] = [
  { value: '', en: 'All days', fr: 'Tous les jours' },
  { value: '1', en: 'Monday', fr: 'Lundi' },
  { value: '2', en: 'Tuesday', fr: 'Mardi' },
  { value: '3', en: 'Wednesday', fr: 'Mercredi' },
  { value: '4', en: 'Thursday', fr: 'Jeudi' },
  { value: '5', en: 'Friday', fr: 'Vendredi' },
  { value: '6', en: 'Saturday', fr: 'Samedi' },
  { value: '7', en: 'Sunday', fr: 'Dimanche' },
];

interface PromotionProgram {
  id: string;
  name: string;
  nameFr?: string;
  department?: string;
}

interface PromotionClass {
  id: string;
  name: string;
  code?: string;
  programId: string;
  programName: string;
  programNameFr?: string;
  department?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  room?: string;
}

interface Promotion {
  id: string;
  name: string;
  nameFr: string;
  programs: PromotionProgram[];
  classes?: PromotionClass[];
  startDate: string;
  endDate: string;
  durationUnit: string;
  status: string;
}

export function Promotions() {
  const { lang } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; code?: string; programId: string; programName: string; programNameFr?: string; departmentName?: string; departmentNameFr?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameFr: '',
    classIds: [] as string[],
    startDate: '',
    endDate: '',
    durationUnit: 'months',
    status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('');

  function promotionHasClassOnDay(p: Promotion, dayOfWeek: number): boolean {
    const classesList = p.classes || [];
    return classesList.some((cl) => {
      const days = Array.isArray(cl.daysOfWeek) && cl.daysOfWeek.length ? cl.daysOfWeek : [];
      return days.includes(dayOfWeek);
    });
  }

  const filteredPromotions = dayFilter
    ? promotions.filter((p) => promotionHasClassOnDay(p, Number(dayFilter)))
    : promotions;

  useEffect(() => {
    (async () => {
      try {
        const [promRes, classesRes] = await Promise.all([
          apiFetch('/promotions'),
          apiFetch('/classes', { requireAuth: true }),
        ]);
        setPromotions(promRes.promotions || []);
        setClasses((classesRes.classes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          programId: c.programId,
          programName: c.programName || '',
          programNameFr: c.programNameFr,
          departmentName: c.departmentName,
          departmentNameFr: c.departmentNameFr,
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAdd = () => {
    setForm({ name: '', nameFr: '', classIds: [], startDate: '', endDate: '', durationUnit: 'months', status: 'upcoming' });
    setEditing(null);
    setError('');
    setModal('add');
  };

  const openEdit = (p: Promotion) => {
    setForm({
      name: p.name,
      nameFr: p.nameFr || '',
      classIds: (p.classes || []).map((c) => c.id),
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      durationUnit: p.durationUnit || 'months',
      status: p.status || 'upcoming',
    });
    setEditing(p);
    setError('');
    setModal('edit');
  };

  const toggleClass = (classId: string) => {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(classId)
        ? f.classIds.filter((id) => id !== classId)
        : [...f.classIds, classId],
    }));
  };

  const save = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError(lang === 'fr' ? 'Nom et dates requis' : 'Name and dates required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, nameFr: form.nameFr, startDate: form.startDate, endDate: form.endDate, durationUnit: form.durationUnit, status: form.status, classIds: form.classIds };
      if (modal === 'add') {
        const res = await apiFetch('/promotions', { method: 'POST', body: JSON.stringify(payload), requireAuth: true });
        setPromotions((prev) => [...prev, res.promotion]);
      } else if (editing) {
        const res = await apiFetch(`/promotions/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload), requireAuth: true });
        setPromotions((prev) => prev.map((p) => (p.id === editing.id ? res.promotion : p)));
      }
      setModal(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette promotion ?' : 'Delete this promotion?')) return;
    try {
      await apiFetch(`/promotions/${id}`, { method: 'DELETE', requireAuth: true });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const exportData = filteredPromotions.map((p) => ({
    Name: p.name,
    'Name (FR)': p.nameFr || '',
    'Start date': p.startDate || '',
    'End date': p.endDate || '',
    'Duration unit': p.durationUnit || '',
    Status: p.status,
    'Classes count': (p.classes || []).length,
    Programs: (p.programs || []).map((pr) => (lang === 'fr' ? pr.nameFr || pr.name : pr.name)).join('; '),
  }));

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Promotions' : 'Promotions'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr'
              ? 'Créez d\'abord les programmes et les frais, puis les créneaux dans chaque programme. Ici, lancez une promotion en sélectionnant les classes à inclure.'
              : 'Create programs and fees first, then add classes in each program. Here you launch a promotion by selecting which classes to include.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dayFilter}
            onChange={(e) => { setDayFilter(e.target.value); setSelected(null); }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[140px]"
            title={lang === 'fr' ? 'Filtrer par jour' : 'Filter by day'}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value || 'all'} value={d.value}>{lang === 'fr' ? d.fr : d.en}</option>
            ))}
          </select>
          <ExportReportButton data={exportData} filename="promotions" label={lang === 'fr' ? 'Exporter' : 'Export'} compact />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90"
            style={{ background: 'var(--btc-primary,#16a34a)' }}
          >
            <Plus size={18} /> {lang === 'fr' ? 'Nouvelle promotion' : 'New promotion'}
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {promotions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucune promotion. ' : 'No promotions yet. '}
            <Link to="/dashboard/academic/programs" className="text-green-600 dark:text-green-400 font-medium hover:underline">
              {lang === 'fr' ? 'Créez d\'abord les programmes et les créneaux' : 'Create programs and classes first'}
            </Link>
            {lang === 'fr' ? ', puis lancez une promotion ici.' : ', then launch a promotion here.'}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucune promotion avec des cours ce jour-là.' : 'No promotions with classes on this day.'}
          </div>
        ) : (
          filteredPromotions.map((p) => {
            const start = p.startDate ? new Date(p.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '';
            const end = p.endDate ? new Date(p.endDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '';
            const classCount = (p.classes || []).length;
            const programNames = (p.programs || []).map((pr) => (lang === 'fr' ? pr.nameFr || pr.name : pr.name)).join(', ') || '—';
            const isExpanded = selected?.id === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <motion.div
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(isExpanded ? null : p)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30 shrink-0">
                      <CalendarDays size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {lang === 'fr' ? (p.nameFr || p.name) : p.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {classCount} {lang === 'fr' ? 'classe(s)' : 'class(es)'}
                        {(p.programs || []).length > 0 && ` · ${programNames}`} · {start} → {end} ({p.durationUnit})
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400 shrink-0" /> : <ChevronDown size={20} className="text-gray-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {STATUS_OPTIONS.find((s) => s.id === p.status)?.[lang === 'fr' ? 'fr' : 'en'] || p.status}
                    </span>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      title={lang === 'fr' ? 'Modifier' : 'Edit'}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30"
                    >
                      <div className="p-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{lang === 'fr' ? 'Début' : 'Start date'}</p>
                            <p className="text-sm text-gray-900 dark:text-white">{p.startDate ? new Date(p.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{lang === 'fr' ? 'Fin' : 'End date'}</p>
                            <p className="text-sm text-gray-900 dark:text-white">{p.endDate ? new Date(p.endDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{lang === 'fr' ? 'Unité de durée' : 'Duration unit'}</p>
                            <p className="text-sm text-gray-900 dark:text-white">{DURATION_UNITS.find((u) => u.id === p.durationUnit)?.[lang === 'fr' ? 'fr' : 'en'] || p.durationUnit}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{lang === 'fr' ? 'Statut' : 'Status'}</p>
                            <p className="text-sm text-gray-900 dark:text-white">{STATUS_OPTIONS.find((s) => s.id === p.status)?.[lang === 'fr' ? 'fr' : 'en'] || p.status}</p>
                          </div>
                        </div>

                        {(p.programs || []).length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                              <BookOpen size={14} /> {lang === 'fr' ? 'Programmes (dérivés)' : 'Programs (derived)'}
                            </h3>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {(p.programs || []).map((pr) => (lang === 'fr' ? pr.nameFr || pr.name : pr.name)).join(', ')}
                            </p>
                          </div>
                        )}

                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                            <Clock size={14} /> {lang === 'fr' ? 'Classes dans cette promotion' : 'Classes in this promotion'}
                          </h3>
                          {(p.classes || []).length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucune classe associée.' : 'No classes in this promotion.'}</p>
                          ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Code' : 'Code'}</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Nom' : 'Name'}</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Programme' : 'Program'}</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Horaire' : 'Schedule'}</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Salle' : 'Room'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(p.classes || []).map((cl) => (
                                    <tr key={cl.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                      <td className="px-4 py-2.5 text-gray-900 dark:text-white font-mono text-xs">{cl.code || '—'}</td>
                                      <td className="px-4 py-2.5 text-gray-900 dark:text-white">{cl.name || '—'}</td>
                                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{lang === 'fr' ? cl.programNameFr || cl.programName : cl.programName}</td>
                                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                                        {[cl.startTime, cl.endTime].filter(Boolean).join(' – ') || '—'}
                                      </td>
                                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{cl.room || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modal === 'add' ? (lang === 'fr' ? 'Nouvelle promotion' : 'New promotion') : (lang === 'fr' ? 'Modifier la promotion' : 'Edit promotion')}
                </h3>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
              </div>
              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Classes dans cette promotion' : 'Classes in this promotion'}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lang === 'fr' ? 'Sélectionnez les créneaux (classes) créés dans les programmes. Une promotion contient plusieurs classes.' : 'Select the classes you created in each program. A promotion has many classes.'}</p>
                  <div className="max-h-48 overflow-y-auto space-y-3 rounded-xl border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50">
                    {(() => {
                      const byProgram = new Map<string, typeof classes>();
                      for (const cl of classes) {
                        const list = byProgram.get(cl.programId) || [];
                        list.push(cl);
                        byProgram.set(cl.programId, list);
                      }
                      return Array.from(byProgram.entries()).map(([programId, list]) => {
                        const progName = list[0]?.programName;
                        const progNameFr = list[0]?.programNameFr;
                        return (
                          <div key={programId}>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{lang === 'fr' ? progNameFr || progName : progName}</p>
                            <div className="space-y-1 pl-2">
                              {list.map((cl) => {
                                const checked = form.classIds.includes(cl.id);
                                return (
                                  <label key={cl.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={checked} onChange={() => toggleClass(cl.id)} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                    <span className="text-sm text-gray-800 dark:text-gray-200">{cl.code ? `${cl.code} — ` : ''}{cl.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'} *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. English 2025 Q1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'}</label>
                  <input type="text" value={form.nameFr} onChange={(e) => setForm((f) => ({ ...f, nameFr: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. Anglais 2025 T1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Début' : 'Start date'} *</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Fin' : 'End date'} *</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Unité de durée' : 'Duration unit'}</label>
                  <select value={form.durationUnit} onChange={(e) => setForm((f) => ({ ...f, durationUnit: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    {DURATION_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>{lang === 'fr' ? u.fr : u.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{lang === 'fr' ? s.fr : s.en}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
                <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null} {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
