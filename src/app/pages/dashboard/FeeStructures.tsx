import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

const FEE_TYPES = [
  { id: 'one-time', en: 'One-time', fr: 'Unique' },
  { id: 'monthly', en: 'Monthly', fr: 'Mensuel' },
  { id: 'per-term', en: 'Per term', fr: 'Par trimestre' },
  { id: 'annual', en: 'Annual', fr: 'Annuel' },
];
const CURRENCIES = ['USD', 'CDF', 'RWF'];

interface FeeStructure {
  id: string;
  name: string;
  nameFr: string;
  amount: number;
  currency: string;
  type: string;
  required: boolean;
  sortOrder: number;
  /** Converted from USD using platform rates (read-only) */
  amountCdf?: number | null;
  amountRwf?: number | null;
}

export function FeeStructures() {
  const { lang } = useLanguage();
  const [list, setList] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<{ usdToCdf?: number; usdToRwf?: number }>({});
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [form, setForm] = useState<FeeStructure>({
    id: '',
    name: '',
    nameFr: '',
    amount: 0,
    currency: 'USD',
    type: 'one-time',
    required: true,
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [data, rates] = await Promise.all([
        apiFetch('/fee-structures'),
        apiFetch('/exchange-rates').catch(() => ({})),
      ]);
      setList(data.feeStructures || []);
      setExchangeRates(rates as { usdToCdf?: number; usdToRwf?: number } || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({ id: '', name: '', nameFr: '', amount: 0, currency: 'USD', type: 'one-time', required: true, sortOrder: list.length });
    setEditing(null);
    setError('');
    setModal('add');
  };

  const openEdit = (item: FeeStructure) => {
    setForm({ ...item });
    setEditing(item);
    setError('');
    setModal('edit');
  };

  const save = async () => {
    if (!form.name) {
      setError(lang === 'fr' ? 'Le nom est obligatoire' : 'Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        const res = await apiFetch('/fee-structures', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            nameFr: form.nameFr,
            amount: form.amount,
            currency: form.currency,
            type: form.type,
            required: form.required,
            sortOrder: form.sortOrder,
          }),
          requireAuth: true,
        });
        setList(prev => [...prev, res.feeStructure]);
      } else if (editing) {
        const res = await apiFetch(`/fee-structures/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name,
            nameFr: form.nameFr,
            amount: form.amount,
            currency: form.currency,
            type: form.type,
            required: form.required,
            sortOrder: form.sortOrder,
          }),
          requireAuth: true,
        });
        setList(prev => prev.map(x => (x.id === editing.id ? res.feeStructure : x)));
      }
      setModal(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette structure de frais ?' : 'Delete this fee structure?')) return;
    try {
      await apiFetch(`/fee-structures/${id}`, { method: 'DELETE', requireAuth: true });
      setList(prev => prev.filter(x => x.id !== id));
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
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Structure des Frais' : 'Fee Structures'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr' ? 'Définir des frais réutilisables (ex: Inscription, Carte étudiant) utilisables dans plusieurs programmes.' : 'Define reusable fees (e.g. Registration, Student card) that can be used across many programs.'}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90"
          style={{ background: 'var(--btc-primary,#16a34a)' }}
        >
          <Plus size={18} /> {lang === 'fr' ? 'Nouvelle structure' : 'New structure'}
        </button>
      </div>

      <div className="grid gap-4">
        {list.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucune structure de frais. Créez-en (ex: Inscription, Carte étudiant) pour les assigner aux programmes.' : 'No fee structures yet. Create some (e.g. Registration, Student card) to assign to programs.'}
          </div>
        ) : (
          list.map((item) => (
            <motion.div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <DollarSign size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {lang === 'fr' ? (item.nameFr || item.name) : item.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.currency === 'CDF' ? 'FC' : item.currency === 'RWF' ? 'FRw' : '$'}{item.amount}
                    {(item.amountCdf != null || item.amountRwf != null) && (
                      <span className="ml-1 text-gray-400 dark:text-gray-500">
                        {item.amountCdf != null && ` · CDF: ${Number(item.amountCdf).toLocaleString()}`}
                        {item.amountRwf != null && ` · RWF: ${Number(item.amountRwf).toLocaleString()}`}
                      </span>
                    )}
                    {' · '}
                    {FEE_TYPES.find(t => t.id === item.type)?.[lang === 'fr' ? 'fr' : 'en'] || item.type}
                    {item.required ? ` · ${lang === 'fr' ? 'Obligatoire' : 'Required'}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Edit2 size={16} /></button>
                <button onClick={() => remove(item.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modal === 'add' ? (lang === 'fr' ? 'Nouvelle structure de frais' : 'New fee structure') : (lang === 'fr' ? 'Modifier la structure' : 'Edit fee structure')}
                </h3>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
              </div>
              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'} *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. Registration" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'}</label>
                  <input type="text" value={form.nameFr} onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="ex: Inscription" />
                </div>
                {editing && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    {lang === 'fr' ? 'Le montant et la devise sont fixes après enregistrement. Corrigez uniquement si nécessaire.' : 'Amount and currency are fixed after save. Correct only when necessary.'}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Montant par défaut' : 'Default amount'}</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" min={0} readOnly={!!editing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Devise' : 'Currency'}</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" disabled={!!editing}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {form.currency === 'USD' && (form.amountCdf != null || form.amountRwf != null || exchangeRates.usdToCdf != null) && (
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    {lang === 'fr' ? 'Équivalents (taux plateforme) : ' : 'Equivalents (platform rates): '}
                    {form.amountCdf != null && <span className="font-medium">CDF {Number(form.amountCdf).toLocaleString()}</span>}
                    {form.amountCdf != null && form.amountRwf != null && ' · '}
                    {form.amountRwf != null && <span className="font-medium">RWF {Number(form.amountRwf).toLocaleString()}</span>}
                    {(exchangeRates.usdToCdf != null || exchangeRates.usdToRwf != null) && (
                      <span className="block mt-1 text-gray-500">1 USD = {exchangeRates.usdToCdf != null ? `${exchangeRates.usdToCdf} CDF` : ''}{exchangeRates.usdToCdf != null && exchangeRates.usdToRwf != null ? ', ' : ''}{exchangeRates.usdToRwf != null ? `${exchangeRates.usdToRwf} RWF` : ''}</span>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                      {FEE_TYPES.map(t => <option key={t.id} value={t.id}>{lang === 'fr' ? t.fr : t.en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Obligatoire' : 'Required'}</label>
                    <select value={form.required ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, required: e.target.value === 'yes' }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                      <option value="yes">{lang === 'fr' ? 'Oui' : 'Yes'}</option>
                      <option value="no">{lang === 'fr' ? 'Non' : 'No'}</option>
                    </select>
                  </div>
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
