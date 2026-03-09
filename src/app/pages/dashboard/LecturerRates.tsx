import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export function LecturerRates() {
  const { lang } = useLanguage();
  const [rates, setRates] = useState<any[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ staffId: '', rateAmount: '', currency: 'USD', rateType: 'per_class', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ratesRes, staffRes] = await Promise.all([
        apiFetch('/lecturer-rates', { requireAuth: true }),
        apiFetch('/staff', { requireAuth: true }),
      ]);
      setRates(ratesRes.rates || []);
      setStaff(staffRes.staff || []);
    } catch {
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.staffId || !form.rateAmount) return;
    setSaving(true);
    try {
      await apiFetch('/lecturer-rates', {
        method: 'POST',
        body: JSON.stringify({
          staffId: form.staffId,
          rateAmount: Number(form.rateAmount),
          currency: form.currency,
          rateType: form.rateType,
          description: form.description || undefined,
        }),
        requireAuth: true,
      });
      setShowAdd(false);
      setForm({ staffId: '', rateAmount: '', currency: 'USD', rateType: 'per_class', description: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const staffName = (id: string) => staff.find(s => s.id === id)?.name || id?.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Taux enseignants' : 'Lecturer rates'}
        </h1>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
          <Plus size={18} /> {lang === 'fr' ? 'Ajouter un taux' : 'Add rate'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Enseignant' : 'Staff'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Montant' : 'Amount'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Type' : 'Type'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Description' : 'Description'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rates.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{lang === 'fr' ? 'Aucun taux' : 'No rates'}</td></tr>
              ) : (
                rates.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{staffName(r.staffId)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{Number(r.rateAmount)} {r.currency || 'USD'}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{r.rateType || 'per_class'}</td>
                    <td className="px-6 py-3 text-gray-500">{r.description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAdd(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{lang === 'fr' ? 'Nouveau taux' : 'New rate'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Enseignant' : 'Staff'}</label>
                <select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  <option value="">—</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Montant' : 'Amount'}</label>
                <input type="number" step={0.01} min={0} value={form.rateAmount} onChange={e => setForm(f => ({ ...f, rateAmount: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Devise' : 'Currency'}</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Description' : 'Description'}</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. per class" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={handleAdd} disabled={saving || !form.staffId || !form.rateAmount} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
