import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, Search,
  CheckCircle, X, Clock, AlertCircle, Eye, Loader2, Filter, Receipt,
  ThumbsUp, ThumbsDown, Image as ImageIcon
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

const DEPT_NAMES: Record<string, Record<string, string>> = {
  english: { en: 'English', fr: 'Anglais' },
  computer: { en: 'Computer Science', fr: 'Informatique' },
  driving: { en: 'Driving', fr: 'Conduite' },
  sewing: { en: 'Sewing', fr: 'Couture' },
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  completed: { en: 'Completed', fr: 'Complété' },
  pending_approval: { en: 'Pending Approval', fr: 'En attente' },
  rejected: { en: 'Rejected', fr: 'Rejeté' },
};

const CURRENCIES: Record<string, string> = { USD: '$', CDF: 'FC', RWF: 'FRw' };

const PIE_COLORS = ['#16a34a', '#2563eb', '#ea580c', '#d946ef', '#f59e0b', '#7c3aed'];

export function Financing() {
  const { lang } = useLanguage();
  const chartId = useId().replace(/:/g, '');

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending_approval' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await apiFetch('/payments', { requireAuth: true });
      const list = data.payments || [];
      const normalized = list.map((p: any) => ({
        ...p,
        studentName: p.studentName ?? p.student?.name ?? '',
        studentEmail: p.studentEmail ?? p.student?.email ?? '',
        programName: p.programName ?? p.programs?.name ?? '',
        programNameFr: p.programNameFr ?? p.programs?.name_fr ?? '',
        department: p.department ?? p.programs?.departments?.slug ?? '',
        createdAt: p.createdAt ?? p.created_at,
        feeName: p.feeName ?? p.fee_item_name ?? '',
        method: p.method ?? p.payment_mode ?? '',
        methodLabel: (p.method || p.payment_mode || '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        rejectionReason: p.rejectionReason ?? p.rejectReason ?? p.rejection_reason ?? '',
        receiptImage: p.receiptImage ?? p.receiptUrl ?? p.receipt_url ?? '',
        transactionId: p.transactionId ?? p.transactionRef ?? p.transaction_ref ?? '',
      }));
      setPayments(normalized);
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const completed = payments.filter(p => p.status === 'completed');
  const pending = payments.filter(p => p.status === 'pending_approval');
  const rejected = payments.filter(p => p.status === 'rejected');
  const totalIncome = completed.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const pendingAmount = pending.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  // Monthly chart data — last 6 months
  const monthlyData = (() => {
    const months: Record<string, { completed: number; pending: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      months[key] = { completed: 0, pending: 0 };
    }
    payments.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (months[key]) {
        const amt = parseFloat(p.amount) || 0;
        if (p.status === 'completed') months[key].completed += amt;
        else if (p.status === 'pending_approval') months[key].pending += amt;
      }
    });
    return Object.entries(months).map(([month, vals]) => ({ month, ...vals }));
  })();

  // Department breakdown
  const deptBreakdown = (() => {
    const byDept: Record<string, number> = {};
    completed.forEach(p => {
      const dept = p.department || 'other';
      byDept[dept] = (byDept[dept] || 0) + (parseFloat(p.amount) || 0);
    });
    return Object.entries(byDept).map(([dept, value], i) => ({
      name: DEPT_NAMES[dept]?.[lang] || dept,
      value: Math.round(value),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  })();

  // Filtered payments
  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = !search || [p.description, p.studentName, p.studentEmail, p.feeName, p.programName, p.methodLabel]
      .filter(Boolean).some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  }).sort((a, b) => {
    // Pending first, then by date descending
    if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
    if (b.status === 'pending_approval' && a.status !== 'pending_approval') return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleApprove = async (id: string) => {
    setApproving(id);
    setActionError('');
    try {
      await apiFetch(`/payments/${id}/approve`, { method: 'PUT', body: JSON.stringify({}) });
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'completed', approvedAt: new Date().toISOString() } : p));
    } catch (e: any) {
      setActionError(e.message || 'Approve failed');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id: string) => {
    setRejecting(id);
    setActionError('');
    try {
      await apiFetch(`/payments/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason: rejectReason }) });
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', rejectionReason: rejectReason, rejectedAt: new Date().toISOString() } : p));
      setRejectModal(null);
      setRejectReason('');
    } catch (e: any) {
      setActionError(e.message || 'Reject failed');
    } finally {
      setRejecting(null);
    }
  };

  const sym = (c: string) => CURRENCIES[c] || '$';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Finances' : 'Financing'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Vue d\'ensemble financière et approbation des paiements' : 'Financial overview and payment approval'}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors">
          <Download size={15} /> {lang === 'fr' ? 'Exporter' : 'Export'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Revenu Total' : 'Total Revenue', value: `$${totalIncome.toLocaleString()}`, icon: ArrowUpRight, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
          { label: lang === 'fr' ? 'En Attente' : 'Pending Approval', value: `$${pendingAmount.toLocaleString()}`, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: lang === 'fr' ? 'Paiements Approuvés' : 'Approved Payments', value: String(completed.length), icon: CheckCircle, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
          { label: lang === 'fr' ? 'Total Transactions' : 'Total Transactions', value: String(payments.length), icon: DollarSign, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                <c.icon size={20} style={{ color: c.color }} />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins' }}>{c.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {actionError && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><AlertCircle size={16} /> {actionError}</p>
          <button onClick={() => setActionError('')} className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"><X size={16} /></button>
        </motion.div>
      )}

      {/* Pending Approval Banner */}
      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300" style={{ fontFamily: 'Poppins' }}>
                {lang === 'fr'
                  ? `${pending.length} paiement(s) en attente d'approbation`
                  : `${pending.length} payment(s) awaiting approval`}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {lang === 'fr'
                  ? `Montant total en attente: $${pendingAmount.toLocaleString()}`
                  : `Total pending amount: $${pendingAmount.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Receipt size={14} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.studentName || p.studentEmail || 'Student'}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.description || p.feeName || '--'} · {p.methodLabel || p.method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{sym(p.currency)}{parseFloat(p.amount || 0).toFixed(0)}</span>
                  {p.receiptImage && (
                    <button onClick={() => setDetailModal(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View receipt">
                      <ImageIcon size={14} />
                    </button>
                  )}
                  <button onClick={() => handleApprove(p.id)} disabled={approving === p.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
                    {approving === p.id ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                    {lang === 'fr' ? 'Approuver' : 'Approve'}
                  </button>
                  <button onClick={() => { setRejectModal(p.id); setRejectReason(''); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <ThumbsDown size={12} /> {lang === 'fr' ? 'Rejeter' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Revenus Mensuels' : 'Monthly Revenue'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{lang === 'fr' ? '6 derniers mois' : 'Last 6 months'}</p>
          {monthlyData.some(m => m.completed > 0 || m.pending > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id={`incGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`pendGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`$${v}`, '']} />
                <Area type="monotone" dataKey="completed" stroke="#16a34a" fill={`url(#incGrad-${chartId})`} strokeWidth={2} name={lang === 'fr' ? 'Complété' : 'Completed'} />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill={`url(#pendGrad-${chartId})`} strokeWidth={2} name={lang === 'fr' ? 'En attente' : 'Pending'} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-300 dark:text-gray-600 text-sm">
              {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Par Département' : 'By Department'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lang === 'fr' ? 'Revenus par département' : 'Revenue by department'}</p>
          {deptBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deptBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {deptBreakdown.map((e, i) => <Cell key={`cell-${chartId}-${i}`} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`$${v}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {deptBreakdown.map((e, i) => (
                  <div key={`legend-${i}`} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />{e.name}
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">${e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-300 dark:text-gray-600 text-sm">
              {lang === 'fr' ? 'Aucune donnée' : 'No data'}
            </div>
          )}
        </div>
      </div>

      {/* Review payments — table with approve/decline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>
                {lang === 'fr' ? 'Réviser les paiements' : 'Review Payments'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'fr' ? 'Consulter les détails, voir le reçu, approuver ou rejeter (avec une note obligatoire).' : 'View details and receipt, approve or decline (note required when declining).'}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:flex-none">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                  placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} />
              </div>
              <div className="flex gap-1">
                {(['all', 'pending_approval', 'completed', 'rejected'] as const).map(f => {
                  const labels: Record<string, Record<string, string>> = {
                    all: { en: 'All', fr: 'Tous' },
                    pending_approval: { en: 'Pending', fr: 'En attente' },
                    completed: { en: 'Completed', fr: 'Complété' },
                    rejected: { en: 'Rejected', fr: 'Rejeté' },
                  };
                  return (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                      style={filter === f ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                      {labels[f]?.[lang] || f}
                      {f === 'pending_approval' && pending.length > 0 && (
                        <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <DollarSign size={32} className="mx-auto mb-2 opacity-40" />
            {lang === 'fr' ? 'Aucune transaction trouvée.' : 'No transactions found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    lang === 'fr' ? 'Date' : 'Date',
                    lang === 'fr' ? 'Étudiant' : 'Student',
                    lang === 'fr' ? 'Description' : 'Description',
                    lang === 'fr' ? 'Programme' : 'Program',
                    lang === 'fr' ? 'Méthode' : 'Method',
                    lang === 'fr' ? 'Montant' : 'Amount',
                    lang === 'fr' ? 'Statut' : 'Status',
                    lang === 'fr' ? 'Actions' : 'Actions',
                  ].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                    p.status === 'pending_approval' ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''
                  }`}>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate max-w-[120px]">{p.studentName || '--'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">{p.studentEmail || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-[160px] truncate">
                      {p.description || p.feeName || '--'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {lang === 'fr' ? (p.programNameFr || p.programName) : p.programName || '--'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {p.methodLabel || p.method || '--'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold whitespace-nowrap text-green-600 dark:text-green-400">
                      {sym(p.currency)}{parseFloat(p.amount || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[p.status]?.[lang] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailModal(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Eye size={14} />
                        </button>
                        {p.status === 'pending_approval' && (
                          <>
                            <button onClick={() => handleApprove(p.id)} disabled={approving === p.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50">
                              {approving === p.id ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                            </button>
                            <button onClick={() => { setRejectModal(p.id); setRejectReason(''); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <ThumbsDown size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal — note required */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setRejectModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl">
              <h4 className="text-lg text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                {lang === 'fr' ? 'Rejeter le paiement' : 'Reject Payment'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {lang === 'fr'
                  ? 'Veuillez indiquer la raison du rejet (obligatoire). L\'étudiant pourra la consulter.'
                  : 'Please provide a reason for the rejection (required). The student will be able to see it.'}
              </p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-red-500 h-28 resize-none placeholder:text-gray-400"
                placeholder={lang === 'fr' ? 'Ex: reçu illisible, montant incorrect...' : 'e.g. receipt unclear, wrong amount...'}
                required />
              {actionError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle size={12} /> {actionError}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); setActionError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      setActionError(lang === 'fr' ? 'Veuillez saisir une raison.' : 'Please enter a reason.');
                      return;
                    }
                    setActionError('');
                    handleReject(rejectModal);
                  }}
                  disabled={rejecting === rejectModal}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {rejecting === rejectModal ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                  {lang === 'fr' ? 'Rejeter' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setDetailModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    detailModal.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                    detailModal.status === 'pending_approval' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {detailModal.status === 'completed' ? <CheckCircle size={28} className="text-green-500" /> :
                     detailModal.status === 'pending_approval' ? <Clock size={28} className="text-amber-500" /> :
                     <X size={28} className="text-red-500" />}
                  </div>
                  <h4 className="text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                    {lang === 'fr' ? 'Détails du Paiement' : 'Payment Details'}
                  </h4>
                  <p className="text-xs text-gray-400">Ref: {detailModal.id}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
                  {[
                    { label: lang === 'fr' ? 'Étudiant' : 'Student', value: detailModal.studentName || '--' },
                    { label: 'Email', value: detailModal.studentEmail || '--' },
                    { label: 'Description', value: detailModal.description || detailModal.feeName || '--' },
                    { label: lang === 'fr' ? 'Programme' : 'Program', value: (lang === 'fr' ? (detailModal.programNameFr || detailModal.programName) : detailModal.programName) || '--' },
                    { label: lang === 'fr' ? 'Département' : 'Department', value: DEPT_NAMES[detailModal.department]?.[lang] || detailModal.department || '--' },
                    { label: lang === 'fr' ? 'Montant' : 'Amount', value: `${sym(detailModal.currency)}${parseFloat(detailModal.amount || 0).toFixed(0)} ${detailModal.currency || 'USD'}`, bold: true },
                    { label: lang === 'fr' ? 'Méthode' : 'Method', value: detailModal.methodLabel || detailModal.method || '--' },
                    { label: 'Date', value: detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString() : '--' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-500">{item.label}</span>
                      <span className={`text-right max-w-[60%] ${item.bold ? 'font-bold text-green-600' : 'font-medium text-gray-900 dark:text-white'}`}>{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">{lang === 'fr' ? 'Statut' : 'Status'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[detailModal.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[detailModal.status]?.[lang] || detailModal.status}
                    </span>
                  </div>
                  {detailModal.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{lang === 'fr' ? 'Téléphone' : 'Phone'}</span>
                      <span className="text-gray-900 dark:text-white">{detailModal.phoneNumber}</span>
                    </div>
                  )}
                  {detailModal.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs">{detailModal.transactionId}</span>
                    </div>
                  )}
                  {detailModal.rejectionReason && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{lang === 'fr' ? 'Raison du rejet' : 'Rejection reason'}</span>
                      <span className="text-red-500 text-xs text-right max-w-[60%]">{detailModal.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Receipt image */}
                {detailModal.receiptImage && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">{lang === 'fr' ? 'Reçu téléchargé' : 'Uploaded Receipt'}</p>
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={detailModal.receiptImage} alt="Receipt" className="w-full max-h-64 object-contain bg-gray-50 dark:bg-gray-800" />
                    </div>
                  </div>
                )}

                {/* Quick actions for pending */}
                {detailModal.status === 'pending_approval' && (
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => { handleApprove(detailModal.id); setDetailModal(null); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                      <ThumbsUp size={14} /> {lang === 'fr' ? 'Approuver' : 'Approve'}
                    </button>
                    <button onClick={() => { setRejectModal(detailModal.id); setDetailModal(null); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                      <ThumbsDown size={14} /> {lang === 'fr' ? 'Rejeter' : 'Reject'}
                    </button>
                  </div>
                )}

                <button onClick={() => setDetailModal(null)} className="w-full mt-4 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {lang === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}