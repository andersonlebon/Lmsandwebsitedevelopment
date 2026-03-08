import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Save, Loader2, TrendingUp, Edit2, X, Check } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

interface ExchangeRateRow {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: 'manual' | 'api';
  updatedAt: string | null;
}

export function ExchangeRates() {
  const { lang } = useLanguage();
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await apiFetch('/exchange-rates');
      setRates(data.rates || []);
      setError('');
    } catch (e) {
      console.error(e);
      setError((e as Error).message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const refreshFromApi = async () => {
    setRefreshing(true);
    setError('');
    setSuccess('');
    try {
      const data = await apiFetch('/exchange-rates/refresh', {
        method: 'POST',
        requireAuth: true,
      });
      setRates(data.rates || []);
      setSuccess(lang === 'fr' ? 'Taux mis à jour depuis l’API en ligne.' : 'Rates updated from online API.');
    } catch (e: any) {
      setError(e.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const startEdit = (row: ExchangeRateRow) => {
    setEditingId(row.id);
    setEditValue(String(row.rate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveOne = async () => {
    if (editingId == null) return;
    const row = rates.find(r => r.id === editingId);
    if (!row) return;
    const rate = Number(editValue);
    if (Number.isNaN(rate) || rate < 0) {
      setError(lang === 'fr' ? 'Montant invalide' : 'Invalid amount');
      return;
    }
    setSaving(editingId);
    setError('');
    try {
      const data = await apiFetch('/exchange-rates', {
        method: 'PUT',
        body: JSON.stringify({ targetCurrency: row.targetCurrency, rate }),
        requireAuth: true,
      });
      setRates(data.rates || []);
      setEditingId(null);
      setEditValue('');
      setSuccess(lang === 'fr' ? 'Taux enregistré.' : 'Rate saved.');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(null);
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
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-bold" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Taux de change' : 'Exchange Rates'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {lang === 'fr'
              ? 'Gérez les taux USD → CDF / RWF. Utilisés pour convertir les montants des structures de frais.'
              : 'Manage USD → CDF / RWF rates. Used to convert fee structure amounts.'}
          </p>
        </div>
        <button
          onClick={refreshFromApi}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--btc-primary,#16a34a)' }}
        >
          {refreshing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {lang === 'fr' ? 'Mettre à jour depuis l’API' : 'Update from online API'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
          {success}
        </div>
      )}

      <div className="grid gap-4">
        {rates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            {lang === 'fr'
              ? 'Aucun taux. Lancez le seed (npm run db:seed) ou mettez à jour depuis l’API.'
              : 'No rates yet. Run seed (npm run db:seed) or update from API.'}
          </div>
        ) : (
          rates.map((row) => (
            <motion.div
              key={row.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp size={22} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    1 {row.baseCurrency} = {editingId === row.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-28 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        min={0}
                        step={0.01}
                      />
                    ) : (
                      <span className="text-green-600 dark:text-green-400">{Number(row.rate).toLocaleString()}</span>
                    )}{' '}
                    {row.targetCurrency}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {row.source === 'api'
                      ? (lang === 'fr' ? 'Source : API en ligne' : 'Source: online API')
                      : (lang === 'fr' ? 'Source : manuel' : 'Source: manual')}
                    {row.updatedAt && (
                      <> · {lang === 'fr' ? 'Modifié' : 'Updated'}: {new Date(row.updatedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingId === row.id ? (
                  <>
                    <button
                      onClick={saveOne}
                      disabled={saving === row.id}
                      className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                    >
                      {saving === row.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={cancelEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(row)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    title={lang === 'fr' ? 'Modifier le taux' : 'Edit rate'}
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
