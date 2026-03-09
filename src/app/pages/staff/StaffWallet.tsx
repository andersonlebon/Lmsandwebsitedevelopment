import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export function StaffWallet() {
  const { lang } = useLanguage();
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/lecturer-wallet/my', { requireAuth: true });
      setWallet(d.wallet || { balance: 0, currency: 'USD' });
      setTransactions(d.transactions || []);
    } catch {
      setWallet({ balance: 0, currency: 'USD' });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdvanceRequest = async () => {
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: lang === 'fr' ? 'Montant invalide' : 'Invalid amount' });
      return;
    }
    if (wallet && amount > wallet.balance) {
      setMessage({ type: 'error', text: lang === 'fr' ? 'Solde insuffisant' : 'Insufficient balance' });
      return;
    }
    setAdvanceLoading(true);
    setMessage(null);
    try {
      await apiFetch('/lecturer-wallet/advance-request', {
        method: 'POST',
        body: JSON.stringify({ amount, description: advanceDescription || undefined }),
        requireAuth: true,
      });
      setAdvanceAmount('');
      setAdvanceDescription('');
      setMessage({ type: 'success', text: lang === 'fr' ? 'Demande enregistrée' : 'Request submitted' });
      load();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || (lang === 'fr' ? 'Échec' : 'Failed') });
    } finally {
      setAdvanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
        {lang === 'fr' ? 'Mon portefeuille' : 'My wallet'}
      </h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--btc-primary,#2E8B57)', opacity: 0.9 }}>
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Solde disponible' : 'Available balance'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
              {wallet?.balance ?? 0} {wallet?.currency ?? 'USD'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{lang === 'fr' ? 'Demande d\'avance' : 'Advance request'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {lang === 'fr' ? 'Demandez un acompte sur votre solde. Le montant sera déduit de votre portefeuille.' : 'Request an advance from your balance. The amount will be deducted from your wallet.'}
        </p>
        {message && (
          <p className={`text-sm mb-3 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
        )}
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Montant' : 'Amount'}</label>
            <input type="number" step={0.01} min={0} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}</label>
            <input type="text" value={advanceDescription} onChange={e => setAdvanceDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <button onClick={handleAdvanceRequest} disabled={advanceLoading || !advanceAmount}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--btc-primary,#2E8B57)' }}
          >
            {advanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {lang === 'fr' ? 'Demander un acompte' : 'Request advance'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h2 className="px-6 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">
          {lang === 'fr' ? 'Historique' : 'History'}
        </h2>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">{lang === 'fr' ? 'Aucune transaction' : 'No transactions'}</div>
          ) : (
            transactions.map((tx, i) => (
              <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'attendance_credit' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {tx.type === 'attendance_credit' ? <ArrowDownLeft size={14} className="text-green-600" /> : <ArrowUpRight size={14} className="text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.type === 'attendance_credit' ? (lang === 'fr' ? 'Présence' : 'Attendance credit') : tx.type === 'advance' ? (lang === 'fr' ? 'Acompte' : 'Advance') : tx.type}
                    </p>
                    <p className="text-xs text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${tx.type === 'attendance_credit' ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  {tx.type === 'attendance_credit' ? '+' : '-'}{tx.amount} {wallet?.currency ?? 'USD'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
