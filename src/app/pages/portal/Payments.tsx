import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign, CreditCard, Clock, CheckCircle, ArrowRight, Receipt, AlertCircle,
  X, Upload, Phone, Banknote, Smartphone, Loader2, BookOpen, ChevronDown, Tag
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../lib/api';

type PaymentMode = 'manual' | 'airtel' | 'orange' | 'mobile' | 'visa';
type Currency = 'USD' | 'CDF' | 'RWF';

interface Fee {
  id: string;
  name: string;
  nameFr: string;
  amount: number;
  currency: string;
  type: string;
  required: boolean;
}

interface Program {
  id: string;
  department: string;
  name: string;
  nameFr: string;
  status: string;
  fees: Fee[];
}

const PAYMENT_MODES: { id: PaymentMode; label: string; labelFr: string; icon: any; color: string; desc: string; descFr: string }[] = [
  { id: 'manual', label: 'Manual / Cash', labelFr: 'Manuel / Especes', icon: Banknote, color: '#f59e0b', desc: 'Upload your receipt', descFr: 'Telechargez votre recu' },
  { id: 'airtel', label: 'Airtel Money', labelFr: 'Airtel Money', icon: Smartphone, color: '#ef4444', desc: 'Pay via Airtel Money', descFr: 'Payer via Airtel Money' },
  { id: 'orange', label: 'Orange Money', labelFr: 'Orange Money', icon: Smartphone, color: '#f97316', desc: 'Pay via Orange Money', descFr: 'Payer via Orange Money' },
  { id: 'mobile', label: 'Mobile Money', labelFr: 'Mobile Money', icon: Phone, color: '#3b82f6', desc: 'Pay via Mobile Money', descFr: 'Payer via Mobile Money' },
  { id: 'visa', label: 'Visa Card', labelFr: 'Carte Visa', icon: CreditCard, color: '#7c3aed', desc: 'Pay with Visa/Mastercard', descFr: 'Payer par carte Visa/Mastercard' },
];

const CURRENCIES: { id: Currency; symbol: string; name: string }[] = [
  { id: 'USD', symbol: '$', name: 'US Dollar' },
  { id: 'CDF', symbol: 'FC', name: 'Franc Congolais' },
  { id: 'RWF', symbol: 'FRw', name: 'Franc Rwandais' },
];

const DEPT_NAMES: Record<string, Record<string, string>> = {
  english: { en: 'English', fr: 'Anglais' },
  computer: { en: 'Computer Science', fr: 'Informatique' },
  driving: { en: 'Driving', fr: 'Conduite' },
  sewing: { en: 'Sewing', fr: 'Couture' },
};

const FEE_TYPE_LABELS: Record<string, Record<string, string>> = {
  'one-time': { en: 'One-time', fr: 'Unique' },
  'monthly': { en: 'Monthly', fr: 'Mensuel' },
  'per-term': { en: 'Per term', fr: 'Par trimestre' },
  'annual': { en: 'Annual', fr: 'Annuel' },
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, Record<string, string>> = {
  completed: { en: 'Paid', fr: 'Paye' },
  pending_approval: { en: 'Pending Approval', fr: 'En attente' },
  rejected: { en: 'Rejected', fr: 'Rejete' },
};

export function PortalPayments() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  // Data
  const [programs, setPrograms] = useState<Program[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Selection state
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any | null>(null);

  // Payment form state
  const [payMode, setPayMode] = useState<PaymentMode | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Create enrollment from pending promotion (after registration) then load programs and payments
  useEffect(() => {
    const pending = localStorage.getItem('btc_pending_payment');
    const pendingData = pending ? (() => { try { return JSON.parse(pending); } catch { return null; } })() : null;
    if (user && pendingData?.promotionId && pendingData?.courseId) {
      apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ promotionId: pendingData.promotionId, programId: pendingData.courseId, classId: pendingData.classId || undefined }), requireAuth: true })
        .then(() => { /* enrollment created */ })
        .catch((e) => console.warn('Enrollment from pending promotion:', e.message));
    }
  }, [user?.id]);

  // Load programs and payments
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/programs');
        const activePrograms = (data.programs || []).filter((p: Program) => p.status === 'active');
        setPrograms(activePrograms);

        // Auto-select if only one program or if pending payment from registration
        const pending = localStorage.getItem('btc_pending_payment');
        if (pending) {
          try {
            const pendingData = JSON.parse(pending);
            const matched = activePrograms.find((p: Program) =>
              p.id === pendingData.courseId ||
              p.name.toLowerCase() === (pendingData.courseName || '').toLowerCase() ||
              (p.nameFr || '').toLowerCase() === (pendingData.courseName || '').toLowerCase()
            );
            if (matched) setSelectedProgramId(matched.id);
          } catch (_) { /* ignore */ }
        }
        if (activePrograms.length === 1) {
          setSelectedProgramId((prev) => prev || activePrograms[0].id);
        }
      } catch (e) {
        console.error('Failed to load programs:', e);
      } finally {
        setLoadingPrograms(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/payments/my');
        setPayments(data.payments || []);
      } catch (e) {
        console.error('Failed to load payments:', e);
      } finally {
        setLoadingPayments(false);
      }
    })();
  }, []);

  const selectedProgram = programs.find(p => p.id === selectedProgramId) || null;
  const programFees = selectedProgram?.fees || [];

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending_approval').length;

  // Check if a fee has been paid
  const isFeeFullyPaid = (fee: Fee): boolean => {
    return payments.some(p =>
      p.status === 'completed' &&
      p.feeId === fee.id &&
      p.programId === selectedProgramId
    );
  };

  const isFeePending = (fee: Fee): boolean => {
    return payments.some(p =>
      p.status === 'pending_approval' &&
      p.feeId === fee.id &&
      p.programId === selectedProgramId
    );
  };

  const openPayForFee = (fee: Fee) => {
    setSelectedFee(fee);
    setCurrency((fee.currency as Currency) || 'USD');
    setPayMode(null);
    setPhoneNumber('');
    setTransactionId('');
    setReceiptFile(null);
    setReceiptFileName('');
    setSubmitError('');
    setSubmitSuccess(false);
    setShowPayModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError(lang === 'fr' ? 'Le fichier est trop volumineux (max 2Mo)' : 'File is too large (max 2MB)');
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setReceiptFile(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!payMode || !selectedFee) return;
    if (payMode === 'manual' && !receiptFile) {
      setSubmitError(lang === 'fr' ? 'Veuillez telecharger votre recu' : 'Please upload your receipt');
      return;
    }
    if (['airtel', 'orange', 'mobile'].includes(payMode) && !phoneNumber) {
      setSubmitError(lang === 'fr' ? 'Numero de telephone requis' : 'Phone number required');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const isManual = payMode === 'manual';
      const paymentData: any = {
        amount: selectedFee.amount,
        currency,
        method: payMode,
        methodLabel: PAYMENT_MODES.find(m => m.id === payMode)?.label || payMode,
        description: `${lang === 'fr' ? (selectedFee.nameFr || selectedFee.name) : selectedFee.name} — ${lang === 'fr' ? (selectedProgram?.nameFr || selectedProgram?.name) : selectedProgram?.name}`,
        status: isManual ? 'pending_approval' : 'completed',
        studentName: user?.name || '',
        studentEmail: user?.email || '',
        feeId: selectedFee.id,
        feeName: selectedFee.name,
        feeNameFr: selectedFee.nameFr,
        feeType: selectedFee.type,
        programId: selectedProgramId,
        programName: selectedProgram?.name || '',
        programNameFr: selectedProgram?.nameFr || '',
        department: selectedProgram?.department || '',
      };

      if (isManual) {
        paymentData.receiptImage = receiptFile;
        paymentData.receiptFileName = receiptFileName;
      }
      if (['airtel', 'orange', 'mobile'].includes(payMode)) {
        paymentData.phoneNumber = phoneNumber;
        paymentData.transactionId = transactionId;
      }

      const result = await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        requireAuth: true,
      });

      setPayments(prev => [result.payment, ...prev]);
      setSubmitSuccess(true);

      // Clear pending payment flag
      localStorage.removeItem('btc_pending_payment');
    } catch (e: any) {
      console.error('Payment error:', e);
      setSubmitError(e.message || (lang === 'fr' ? 'Erreur de paiement' : 'Payment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const currencySymbol = CURRENCIES.find(c => c.id === currency)?.symbol || '$';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Paiements' : 'Payments'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {lang === 'fr' ? 'Selectionnez votre programme et payez les frais associes' : 'Select your program and pay the associated fees'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Paye' : 'Total Paid', value: `$${totalPaid.toFixed(0)}`, icon: CheckCircle, color: '#16a34a', sub: lang === 'fr' ? 'Depuis l\'inscription' : 'Since enrollment' },
          { label: lang === 'fr' ? 'En Attente' : 'Pending', value: String(pendingCount), icon: Clock, color: '#f59e0b', sub: lang === 'fr' ? 'Paiements en cours de verification' : 'Payments under review' },
          { label: lang === 'fr' ? 'Transactions' : 'Transactions', value: String(payments.length), icon: Receipt, color: '#3b82f6', sub: lang === 'fr' ? 'Total des transactions' : 'Total transactions' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                <card.icon size={17} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Program & Fee Selection ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <BookOpen size={16} style={{ color: 'var(--btc-primary,#16a34a)' }} />
          <h3 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {lang === 'fr' ? 'Selectionnez votre Programme' : 'Select your Program'}
          </h3>
        </div>

        <div className="p-6">
          {loadingPrograms ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400 text-sm">
                {lang === 'fr'
                  ? 'Aucun programme disponible. L\'administrateur doit d\'abord creer les programmes et frais.'
                  : 'No programs available. Admin must create programs and fees first.'}
              </p>
            </div>
          ) : (
            <>
              {/* Program selector */}
              <div className="relative mb-6">
                <select
                  value={selectedProgramId || ''}
                  onChange={e => setSelectedProgramId(e.target.value || null)}
                  className="w-full appearance-none px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:border-green-500 pr-10"
                >
                  <option value="">{lang === 'fr' ? '— Choisir un programme —' : '— Choose a program —'}</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {(lang === 'fr' ? p.departmentNameFr : p.departmentName) || DEPT_NAMES[p.department]?.[lang] || p.department} — {lang === 'fr' ? (p.nameFr || p.name) : p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Fee list for selected program */}
              {selectedProgram && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {programFees.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                      <DollarSign size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-400 text-sm">
                        {lang === 'fr'
                          ? 'Aucun frais defini pour ce programme. Contactez l\'administration.'
                          : 'No fees defined for this program. Contact administration.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {lang === 'fr' ? 'Frais du Programme' : 'Program Fees'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {programFees.length} {lang === 'fr' ? 'frais' : 'fees'}
                        </span>
                      </div>

                      {programFees.map((fee) => {
                        const paid = isFeeFullyPaid(fee);
                        const pending = isFeePending(fee);
                        return (
                          <motion.div key={fee.id} layout
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                              paid
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                : pending
                                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                            }`}>
                            {/* Status icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              paid ? 'bg-green-100 dark:bg-green-900/30' :
                              pending ? 'bg-amber-100 dark:bg-amber-900/30' :
                              'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {paid ? <CheckCircle size={18} className="text-green-500" /> :
                               pending ? <Clock size={18} className="text-amber-500" /> :
                               <DollarSign size={18} className="text-gray-400" />}
                            </div>

                            {/* Fee info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {lang === 'fr' ? (fee.nameFr || fee.name) : fee.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">
                                  {FEE_TYPE_LABELS[fee.type]?.[lang === 'fr' ? 'fr' : 'en'] || fee.type}
                                </span>
                                {fee.required && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-500 font-medium">
                                    {lang === 'fr' ? 'Obligatoire' : 'Required'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount + Action */}
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-bold ${
                                paid ? 'text-green-600' : pending ? 'text-amber-600' : 'text-gray-900 dark:text-white'
                              }`}>
                                {CURRENCIES.find(c => c.id === fee.currency)?.symbol || '$'}{fee.amount}
                              </p>
                              {paid ? (
                                <span className="text-xs text-green-500 font-medium">{lang === 'fr' ? 'Paye' : 'Paid'}</span>
                              ) : pending ? (
                                <span className="text-xs text-amber-500 font-medium">{lang === 'fr' ? 'En attente' : 'Pending'}</span>
                              ) : (
                                <button onClick={() => openPayForFee(fee)}
                                  className="text-xs font-semibold px-3 py-1 rounded-lg text-white mt-1 hover:opacity-90 transition-all"
                                  style={{ background: 'var(--btc-primary,#16a34a)' }}>
                                  {lang === 'fr' ? 'Payer' : 'Pay'}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Total row */}
                      <div className="flex justify-between items-center pt-3 px-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {lang === 'fr' ? 'Total du Programme' : 'Program Total'}
                        </span>
                        <span className="text-lg font-bold" style={{ color: 'var(--btc-primary,#16a34a)' }}>
                          ${programFees.reduce((s, f) => s + f.amount, 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {lang === 'fr' ? 'Historique des Paiements' : 'Payment History'}
          </h3>
        </div>
        {loadingPayments ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
            <p>{lang === 'fr' ? 'Aucun paiement encore.' : 'No payments yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {payments.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    p.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                    p.status === 'pending_approval' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {p.status === 'completed' ? <CheckCircle size={18} className="text-green-500" /> :
                     p.status === 'pending_approval' ? <Clock size={18} className="text-amber-500" /> :
                     <X size={18} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.description || p.feeName || p.methodLabel || 'Payment'}</p>
                    <p className="text-xs text-gray-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '--'} {p.methodLabel ? `\u00B7 ${p.methodLabel}` : ''}
                      {p.programName ? ` \u00B7 ${lang === 'fr' ? (p.programNameFr || p.programName) : p.programName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-sm font-bold ${p.status === 'completed' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>
                      {CURRENCIES.find(c => c.id === p.currency)?.symbol || '$'}{parseFloat(p.amount || 0).toFixed(0)}
                    </span>
                    <span className={`block text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${statusColors[p.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[p.status]?.[lang === 'fr' ? 'fr' : 'en'] || p.status}
                    </span>
                  </div>
                  <button onClick={() => setShowReceipt(p)} className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--btc-primary,#16a34a)' }}>
                    <Receipt size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Payment Modal ─── */}
      <AnimatePresence>
        {showPayModal && selectedFee && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowPayModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                    {lang === 'fr' ? 'Payer' : 'Pay'}: {lang === 'fr' ? (selectedFee.nameFr || selectedFee.name) : selectedFee.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'fr' ? (selectedProgram?.nameFr || selectedProgram?.name) : selectedProgram?.name}
                    {' '}&middot;{' '}{DEPT_NAMES[selectedProgram?.department || '']?.[lang] || ''}
                  </p>
                </div>
                <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              </div>

              {submitSuccess ? (
                <div className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${payMode === 'manual' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {payMode === 'manual' ? <Clock size={32} className="text-amber-500" /> : <CheckCircle size={32} className="text-green-500" />}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins' }}>
                    {payMode === 'manual'
                      ? (lang === 'fr' ? 'Recu envoye!' : 'Receipt Sent!')
                      : (lang === 'fr' ? 'Paiement reussi!' : 'Payment Successful!')}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {payMode === 'manual'
                      ? (lang === 'fr'
                          ? 'Votre recu a ete envoye au service financier pour verification.'
                          : 'Your receipt has been sent to the finance department for verification.')
                      : (lang === 'fr' ? 'Votre paiement a ete traite avec succes.' : 'Your payment has been processed successfully.')}
                  </p>
                  <button onClick={() => setShowPayModal(false)}
                    className="px-6 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    {lang === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  {/* Amount display (read-only, from fee) */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">
                        {lang === 'fr' ? 'Montant a payer' : 'Amount to pay'}
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                        {CURRENCIES.find(c => c.id === (selectedFee.currency as Currency))?.symbol || '$'}{selectedFee.amount}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: 'var(--btc-primary,#16a34a)', color: '#fff' }}>
                        {FEE_TYPE_LABELS[selectedFee.type]?.[lang === 'fr' ? 'fr' : 'en'] || selectedFee.type}
                      </span>
                    </div>
                  </div>

                  {/* Currency selector (if paying in different currency) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {lang === 'fr' ? 'Devise de paiement' : 'Payment Currency'}
                    </label>
                    <div className="flex gap-2">
                      {CURRENCIES.map(c => (
                        <button key={c.id} onClick={() => setCurrency(c.id)}
                          className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            currency === c.id
                              ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          <span className="font-bold">{c.symbol}</span> {c.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment mode selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {lang === 'fr' ? 'Mode de Paiement' : 'Payment Method'} *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {PAYMENT_MODES.map(mode => {
                        const Icon = mode.icon;
                        const selected = payMode === mode.id;
                        return (
                          <button key={mode.id} onClick={() => setPayMode(mode.id)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                              selected
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              selected ? 'text-white' : 'text-gray-400'
                            }`} style={selected ? { background: mode.color } : { background: `${mode.color}15` }}>
                              <Icon size={18} style={!selected ? { color: mode.color } : {}} />
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${selected ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                {lang === 'fr' ? mode.labelFr : mode.label}
                              </p>
                              <p className="text-xs text-gray-400">{lang === 'fr' ? mode.descFr : mode.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic fields */}
                  {payMode === 'manual' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {lang === 'fr'
                            ? 'Les paiements manuels necessitent une approbation de l\'administration.'
                            : 'Manual payments require admin approval.'}
                        </p>
                      </div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {lang === 'fr' ? 'Recu / Preuve de paiement *' : 'Receipt / Proof of Payment *'}
                      </label>
                      <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-green-400 transition-colors">
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {receiptFileName || (lang === 'fr' ? 'Cliquez pour telecharger' : 'Click to upload')}
                        </span>
                        <span className="text-xs text-gray-400">PNG, JPG (max 2Mo)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                      {receiptFile && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={receiptFile} alt="Receipt" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-800" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {payMode && ['airtel', 'orange', 'mobile'].includes(payMode) && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          {lang === 'fr' ? 'Numero de telephone *' : 'Phone Number *'}
                        </label>
                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500"
                          placeholder="+243 ..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          {lang === 'fr' ? 'ID Transaction (optionnel)' : 'Transaction ID (optional)'}
                        </label>
                        <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500"
                          placeholder="TX-XXXXXXX" />
                      </div>
                    </motion.div>
                  )}

                  {payMode === 'visa' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {lang === 'fr' ? 'Le paiement par carte sera traite de maniere securisee.' : 'Card payment will be processed securely.'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          {lang === 'fr' ? 'Numero de carte' : 'Card Number'}
                        </label>
                        <input className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500"
                          placeholder="4242 4242 4242 4242" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                            {lang === 'fr' ? 'Expiration' : 'Expiry'}
                          </label>
                          <input className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500"
                            placeholder="MM/YY" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">CVC</label>
                          <input className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500"
                            placeholder="123" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {submitError && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle size={14} /> {submitError}
                    </div>
                  )}

                  <button onClick={handleSubmitPayment} disabled={!payMode || submitting}
                    className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {payMode === 'manual'
                          ? (lang === 'fr' ? 'Envoyer le Recu' : 'Send Receipt')
                          : (lang === 'fr' ? `Payer ${currencySymbol}${selectedFee.amount}` : `Pay ${currencySymbol}${selectedFee.amount}`)}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Detail Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowReceipt(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  showReceipt.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                  showReceipt.status === 'pending_approval' ? 'bg-amber-50 dark:bg-amber-900/20' :
                  'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {showReceipt.status === 'completed' ? <CheckCircle size={28} className="text-green-500" /> :
                   showReceipt.status === 'pending_approval' ? <Clock size={28} className="text-amber-500" /> :
                   <X size={28} className="text-red-500" />}
                </div>
                <h4 className="text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                  {lang === 'fr' ? 'Details du Paiement' : 'Payment Details'}
                </h4>
                <p className="text-xs text-gray-400">Ref: {showReceipt.id}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{showReceipt.description || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'fr' ? 'Montant' : 'Amount'}</span>
                  <span className="font-bold text-green-600">
                    {CURRENCIES.find(c => c.id === showReceipt.currency)?.symbol || '$'}{parseFloat(showReceipt.amount || 0).toFixed(0)} {showReceipt.currency || 'USD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'fr' ? 'Programme' : 'Program'}</span>
                  <span className="text-gray-900 dark:text-white">{lang === 'fr' ? (showReceipt.programNameFr || showReceipt.programName) : showReceipt.programName || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 dark:text-white">{showReceipt.createdAt ? new Date(showReceipt.createdAt).toLocaleDateString() : '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'fr' ? 'Methode' : 'Method'}</span>
                  <span className="text-gray-900 dark:text-white">{showReceipt.methodLabel || showReceipt.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'fr' ? 'Statut' : 'Status'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[showReceipt.status] || 'bg-gray-100 text-gray-500'}`}>
                    {statusLabels[showReceipt.status]?.[lang === 'fr' ? 'fr' : 'en'] || showReceipt.status}
                  </span>
                </div>
                {showReceipt.rejectionReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'fr' ? 'Raison du rejet' : 'Rejection reason'}</span>
                    <span className="text-red-500 text-xs">{showReceipt.rejectionReason}</span>
                  </div>
                )}
              </div>
              {showReceipt.receiptImage && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
                  <img src={showReceipt.receiptImage} alt="Receipt" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-800" />
                </div>
              )}
              <button onClick={() => setShowReceipt(null)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
