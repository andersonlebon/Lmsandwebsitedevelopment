import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

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

interface PromotionProgram {
  id: string;
  name: string;
  nameFr?: string;
  department?: string;
}

interface Promotion {
  id: string;
  name: string;
  nameFr: string;
  programs: PromotionProgram[];
  startDate: string;
  endDate: string;
  durationUnit: string;
  status: string;
}

export function Promotions() {
  const { lang } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr: string; department?: string; departmentName?: string; departmentNameFr?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameFr: '',
    programIds: [] as string[],
    startDate: '',
    endDate: '',
    durationUnit: 'months',
    status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [promRes, progRes] = await Promise.all([
          apiFetch('/promotions'),
          apiFetch('/programs'),
        ]);
        setPromotions(promRes.promotions || []);
        setPrograms((progRes.programs || []).map((p: any) => ({ id: p.id, name: p.name, nameFr: p.nameFr || p.name, department: p.department, departmentName: p.departmentName, departmentNameFr: p.departmentNameFr })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAdd = () => {
    setForm({ name: '', nameFr: '', programIds: [], startDate: '', endDate: '', durationUnit: 'months', status: 'upcoming' });
    setEditing(null);
    setError('');
    setModal('add');
  };

  const openEdit = (p: Promotion) => {
    setForm({
      name: p.name,
      nameFr: p.nameFr || '',
      programIds: (p.programs || []).map((pr) => pr.id),
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      durationUnit: p.durationUnit || 'months',
      status: p.status || 'upcoming',
    });
    setEditing(p);
    setError('');
    setModal('edit');
  };

  const toggleProgram = (programId: string) => {
    setForm((f) => ({
      ...f,
      programIds: f.programIds.includes(programId)
        ? f.programIds.filter((id) => id !== programId)
        : [...f.programIds, programId],
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
      const payload = { name: form.name, nameFr: form.nameFr, startDate: form.startDate, endDate: form.endDate, durationUnit: form.durationUnit, status: form.status, programIds: form.programIds };
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

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Promotions' : 'Promotions'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr' ? 'Créer des promotions (programme + dates) pour les inscriptions.' : 'Create promotions (program + dates) for enrollment.'}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90"
          style={{ background: 'var(--btc-primary,#16a34a)' }}
        >
          <Plus size={18} /> {lang === 'fr' ? 'Nouvelle promotion' : 'New promotion'}
        </button>
      </div>

      <div className="grid gap-4">
        {promotions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucune promotion. Créez-en une pour que les étudiants puissent s\'inscrire.' : 'No promotions yet. Create one so students can enroll.'}
          </div>
        ) : (
          promotions.map((p) => {
            const start = p.startDate ? new Date(p.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '';
            const end = p.endDate ? new Date(p.endDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '';
            const programNames = (p.programs || []).map((pr) => (lang === 'fr' ? pr.nameFr || pr.name : pr.name)).join(', ') || '—';
            return (
              <motion.div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(p)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                    <CalendarDays size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {lang === 'fr' ? (p.nameFr || p.name) : p.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(p.programs || []).length} {lang === 'fr' ? 'programme(s)' : 'program(s)'}: {programNames} · {start} → {end} ({p.durationUnit})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {STATUS_OPTIONS.find((s) => s.id === p.status)?.[lang === 'fr' ? 'fr' : 'en'] || p.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(p);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(p.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lang === 'fr' ? (selected.nameFr || selected.name) : selected.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selected.startDate && selected.endDate
                  ? `${new Date(selected.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')} → ${new Date(
                      selected.endDate,
                    ).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}`
                  : '—'}
                {selected.durationUnit ? ` · ${selected.durationUnit}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  selected.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : selected.status === 'upcoming'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {STATUS_OPTIONS.find((s) => s.id === selected.status)?.[lang === 'fr' ? 'fr' : 'en'] || selected.status}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              >
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              {lang === 'fr' ? 'Programmes dans cette promotion' : 'Programs in this promotion'}
            </h3>
            {(selected.programs || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === 'fr' ? 'Aucun programme associé.' : 'No programs linked to this promotion.'}
              </p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                {selected.programs.map((pr) => (
                  <li key={pr.id} className="flex items-center justify-between gap-2">
                    <span>{lang === 'fr' ? pr.nameFr || pr.name : pr.name}</span>
                    {pr.department && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{pr.department}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Programmes associés' : 'Associated programs'}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lang === 'fr' ? 'Cochez un ou plusieurs programmes pour cette promotion.' : 'Select one or more programs for this promotion.'}</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50">
                    {programs.map((prog) => {
                      const checked = form.programIds.includes(prog.id);
                      return (
                        <label key={prog.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => toggleProgram(prog.id)} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                          <span className="text-sm text-gray-800 dark:text-gray-200">{(lang === 'fr' ? prog.departmentNameFr || prog.departmentName : prog.departmentName || prog.department) || ''} — {lang === 'fr' ? prog.nameFr || prog.name : prog.name}</span>
                        </label>
                      );
                    })}
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
