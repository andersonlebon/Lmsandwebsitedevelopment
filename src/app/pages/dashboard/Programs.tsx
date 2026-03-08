import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, DollarSign, GraduationCap, Car, Scissors, Monitor,
  ChevronDown, ChevronRight, Save, Loader2, AlertCircle, CheckCircle, Copy, Tag, Clock
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../lib/api';

type FeeType = 'one-time' | 'monthly' | 'per-term' | 'annual';

interface Fee {
  id: string;
  name: string;
  nameFr: string;
  amount: number;
  currency: string;
  type: FeeType;
  required: boolean;
  order: number;
  /** When set, this fee comes from a reusable fee structure; amount can be overridden per program */
  feeStructureId?: string;
}

interface FeeStructure {
  id: string;
  name: string;
  nameFr: string;
  amount: number;
  currency: string;
  type: string;
  required: boolean;
  sortOrder: number;
}

interface Department {
  id: string;
  name: string;
  name_fr?: string;
  slug: string;
  color?: string;
}

interface Program {
  id: string;
  department: string;
  departmentId?: string;
  name: string;
  nameFr: string;
  description?: string;
  descriptionFr?: string;
  status: 'active' | 'inactive';
  fees: Fee[];
  durationMonths?: number;
  totalAmountToPay?: number;
  createdAt?: string;
}

type ProgramForm = Omit<Program, 'id'>;

const DEPT_ICONS: Record<string, { icon: typeof GraduationCap; color: string }> = {
  english: { icon: GraduationCap, color: '#16a34a' },
  computer: { icon: Monitor, color: '#2563eb' },
  driving: { icon: Car, color: '#ea580c' },
  sewing: { icon: Scissors, color: '#d946ef' },
};

const FEE_TYPES: { id: FeeType; en: string; fr: string }[] = [
  { id: 'one-time', en: 'One-time', fr: 'Unique' },
  { id: 'monthly', en: 'Monthly', fr: 'Mensuel' },
  { id: 'per-term', en: 'Per term', fr: 'Par trimestre' },
  { id: 'annual', en: 'Annual', fr: 'Annuel' },
];

const CURRENCIES = ['USD', 'CDF', 'RWF'];

const BLANK_FEE: Omit<Fee, 'id'> = {
  name: '', nameFr: '', amount: 0, currency: 'USD', type: 'one-time', required: true, order: 0,
};

const BLANK_PROGRAM: ProgramForm = {
  department: '', departmentId: '', name: '', nameFr: '', description: '', descriptionFr: '', status: 'active', fees: [], durationMonths: 0,
};

export function Programs() {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingToStructures, setSavingToStructures] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [form, setForm] = useState<ProgramForm>({ ...BLANK_PROGRAM });
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [programClasses, setProgramClasses] = useState<{ id: string; programId: string; name: string; startTime: string; endTime: string; dayOfWeek?: number | null; room?: string }[]>([]);
  const [classModal, setClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ startTime: '', endTime: '', name: '', room: '' });
  const [savingClass, setSavingClass] = useState(false);

  useEffect(() => {
    loadPrograms();
    (async () => {
      try {
        const [feeData, deptData] = await Promise.all([
          apiFetch('/fee-structures'),
          apiFetch('/departments'),
        ]);
        setFeeStructures(feeData.feeStructures || []);
        setDepartments(deptData.departments || []);
      } catch (_) {}
    })();
  }, []);

  const loadPrograms = async () => {
    try {
      const data = await apiFetch('/programs');
      setPrograms(data.programs || []);
    } catch (e) {
      console.error('Failed to load programs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!expandedId) {
      setProgramClasses([]);
      return;
    }
    apiFetch(`/programs/${expandedId}/classes`)
      .then((data: { classes?: any[] }) => setProgramClasses(data.classes || []))
      .catch(() => setProgramClasses([]));
  }, [expandedId]);

  const saveClass = async () => {
    if (!expandedId || !classForm.startTime || !classForm.endTime) return;
    setSavingClass(true);
    setError('');
    try {
      await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify({ programId: expandedId, ...classForm }),
        requireAuth: true,
      });
      const data = await apiFetch(`/programs/${expandedId}/classes`);
      setProgramClasses(data.classes || []);
      setClassForm({ startTime: '', endTime: '', name: '', room: '' });
      setClassModal(false);
    } catch (e: any) {
      setError(e.message || (lang === 'fr' ? 'Erreur' : 'Error'));
    } finally {
      setSavingClass(false);
    }
  };

  const deleteClass = async (classId: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce créneau ?' : 'Delete this class?')) return;
    try {
      await apiFetch(`/classes/${classId}`, { method: 'DELETE', requireAuth: true });
      setProgramClasses(prev => prev.filter(c => c.id !== classId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.departmentId) {
      setError(lang === 'fr' ? 'Le nom et le département sont obligatoires' : 'Name and department are required');
      return;
    }
    setSaving(true);
    setError('');
    const programFees = form.fees.filter(f => f.feeStructureId).map((f) => ({ feeStructureId: f.feeStructureId!, amountOverride: f.amount }));
    const legacyFees = form.fees.filter(f => !f.feeStructureId);
    const payload = { ...form, fees: legacyFees, departmentId: form.departmentId, durationMonths: form.durationMonths ?? 0 };
    if (programFees.length > 0) (payload as any).programFees = programFees;
    try {
      if (modal === 'add') {
        const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const result = await apiFetch('/programs', {
          method: 'POST',
          body: JSON.stringify({ ...payload, id }),
          requireAuth: true,
        });
        setPrograms(prev => [...prev, result.program]);
        setSuccessMsg(lang === 'fr' ? 'Programme créé avec succès !' : 'Program created successfully!');
      } else if (modal === 'edit' && editProgram) {
        const result = await apiFetch(`/programs/${editProgram.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          requireAuth: true,
        });
        setPrograms(prev => prev.map(p => p.id === editProgram.id ? result.program : p));
        setSuccessMsg(lang === 'fr' ? 'Programme mis à jour !' : 'Program updated!');
      }
      setModal(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      const msg = e.message || 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce programme et tous ses frais ?' : 'Delete this program and all its fees?')) return;
    try {
      await apiFetch(`/programs/${id}`, { method: 'DELETE', requireAuth: true });
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      console.error('Delete failed:', e);
      const msg = e?.message || 'Delete failed';
      if (msg.includes('Session expired') || msg.includes('Unauthorized') || msg.includes('log in')) {
        setError(msg);
      }
    }
  };

  const isSessionError = (msg: string) =>
    /session expired|please log in|unauthorized|invalid or missing token/i.test(msg);

  const handleLogInAgain = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const openAdd = () => {
    setForm({ ...BLANK_PROGRAM });
    setEditProgram(null);
    setError('');
    setModal('add');
  };

  const openEdit = (p: Program) => {
    setForm({
      department: p.department || '',
      departmentId: p.departmentId || '',
      name: p.name,
      nameFr: p.nameFr,
      description: p.description || '',
      descriptionFr: p.descriptionFr || '',
      status: p.status,
      fees: [...(p.fees || [])],
      durationMonths: p.durationMonths ?? 0,
    });
    setEditProgram(p);
    setError('');
    setModal('edit');
  };

  // Fee management within the form
  const addFee = () => {
    const newFee: Fee = {
      ...BLANK_FEE,
      id: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order: form.fees.length,
    };
    setForm(f => ({ ...f, fees: [...f.fees, newFee] }));
  };

  const updateFee = (feeId: string, updates: Partial<Fee>) => {
    setForm(f => ({
      ...f,
      fees: f.fees.map(fee => fee.id === feeId ? { ...fee, ...updates } : fee),
    }));
  };

  const removeFee = (feeId: string) => {
    setForm(f => ({ ...f, fees: f.fees.filter(fee => fee.id !== feeId) }));
  };

  const addFeeFromStructure = (fs: FeeStructure) => {
    if (form.fees.some(f => f.feeStructureId === fs.id)) return;
    const newFee: Fee = {
      id: `pf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: fs.name,
      nameFr: fs.nameFr || '',
      amount: fs.amount,
      currency: fs.currency,
      type: fs.type as FeeType,
      required: fs.required,
      order: form.fees.length,
      feeStructureId: fs.id,
    };
    setForm(f => ({ ...f, fees: [...f.fees, newFee] }));
  };

  const saveFeesToStructures = async () => {
    const customFees = form.fees.filter(f => !f.feeStructureId);
    if (customFees.length === 0) {
      setError(lang === 'fr' ? 'Aucun frais personnalisé à enregistrer.' : 'No custom fees to save.');
      return;
    }
    setSavingToStructures(true);
    setError('');
    try {
      const newStructures: FeeStructure[] = [];
      for (const fee of customFees) {
        const res = await apiFetch('/fee-structures', {
          method: 'POST',
          body: JSON.stringify({
            name: fee.name,
            nameFr: fee.nameFr,
            amount: fee.amount,
            currency: fee.currency,
            type: fee.type,
            required: fee.required,
          }),
          requireAuth: true,
        });
        newStructures.push(res.feeStructure);
      }
      setFeeStructures(prev => [...prev, ...newStructures]);
      const structureById = new Map(newStructures.map((s, i) => [customFees[i].id, s]));
      setForm(f => ({
        ...f,
        fees: f.fees.map(fee => {
          if (fee.feeStructureId) return fee;
          const created = structureById.get(fee.id);
          return created ? { ...fee, feeStructureId: created.id, name: created.name, nameFr: created.nameFr || '', amount: created.amount } : fee;
        }),
      }));
      setSuccessMsg(lang === 'fr' ? `${customFees.length} frais enregistrés dans les structures.` : `${customFees.length} fees saved to structures.`);
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setSavingToStructures(false);
    }
  };
  const customFeesCount = form.fees.filter(f => !f.feeStructureId).length;

  const filtered = programs.filter(p => {
    const matchDept = deptFilter === 'all' || p.department === deptFilter || p.departmentId === deptFilter;
    const matchSearch = !search || (p.name + p.nameFr).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchDept && matchSearch && matchStatus;
  });

  const totalFees = programs.reduce((sum, p) => sum + (p.fees?.length || 0), 0);

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Programmes & Frais' : 'Programs & Fees'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {lang === 'fr' ? 'Gérez les programmes et leurs structures tarifaires' : 'Manage programs and their fee structures'}
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all"
          style={{ background: 'var(--btc-primary,#16a34a)' }}>
          <Plus size={16} /> {lang === 'fr' ? 'Nouveau Programme' : 'New Program'}
        </button>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
            <CheckCircle size={16} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Programmes' : 'Total Programs', value: programs.length, color: '#16a34a', icon: BookOpen },
          { label: lang === 'fr' ? 'Programmes Actifs' : 'Active Programs', value: programs.filter(p => p.status === 'active').length, color: '#2563eb', icon: CheckCircle },
          { label: lang === 'fr' ? 'Total Frais' : 'Total Fees', value: totalFees, color: '#7c3aed', icon: DollarSign },
          { label: lang === 'fr' ? 'Départements' : 'Departments', value: new Set(programs.map(p => p.department)).size, color: '#ea580c', icon: Tag },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
            placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500">
          <option value="all">{lang === 'fr' ? 'Tous les départements' : 'All Departments'}</option>
          {departments.map(d => (
            <option key={d.id} value={d.slug}>{lang === 'fr' ? (d.name_fr || d.name) : d.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500">
          <option value="all">{lang === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
          <option value="active">{lang === 'fr' ? 'Actif' : 'Active'}</option>
          <option value="inactive">{lang === 'fr' ? 'Inactif' : 'Inactive'}</option>
        </select>
      </div>

      {/* Programs grid (2 or 3 columns) */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {programs.length === 0
              ? (lang === 'fr' ? 'Aucun programme créé. Cliquez "Nouveau Programme" pour commencer.' : 'No programs yet. Click "New Program" to get started.')
              : (lang === 'fr' ? 'Aucun programme trouvé.' : 'No programs found.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(program => {
            const isExpanded = expandedId === program.id;
            const deptSlug = program.department || '';
            const dept = departments.find(d => d.slug === deptSlug || d.id === program.departmentId);
            const iconAndColor = DEPT_ICONS[deptSlug] || { icon: BookOpen, color: dept?.color || '#666' };
            const DeptIcon = iconAndColor.icon;
            const feesTotal = program.totalAmountToPay ?? (program.fees || []).reduce((s, f) => s + f.amount, 0);
            return (
              <motion.div
                key={program.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
              >
                {/* Card header — click to expand/collapse */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : program.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${iconAndColor.color}20` }}>
                        <DeptIcon size={18} style={{ color: iconAndColor.color }} />
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate" style={{ fontFamily: 'Poppins' }}>
                        {dept ? (lang === 'fr' ? (dept.name_fr || dept.name) : dept.name) : deptSlug || '—'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      program.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {program.status === 'active' ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Inactif' : 'Inactive')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate" style={{ fontFamily: 'Poppins' }}>
                    {lang === 'fr' ? (program.nameFr || program.name) : program.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(program.fees || []).length} {lang === 'fr' ? 'frais' : 'fees'}
                    {feesTotal > 0 && (
                      <span className="font-semibold ml-1" style={{ color: iconAndColor.color }}>= ${feesTotal}</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">
                      {isExpanded ? (lang === 'fr' ? 'Réduire' : 'Collapse') : (lang === 'fr' ? 'Voir détails' : 'View details')}
                    </span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(program)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title={lang === 'fr' ? 'Modifier' : 'Edit'}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(program.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={lang === 'fr' ? 'Supprimer' : 'Delete'}>
                        <Trash2 size={14} />
                      </button>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded: fee table + class times */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                    >
                      <div className="p-4 pt-3 bg-gray-50/50 dark:bg-gray-900/30">
                        {(program.fees || []).length === 0 ? (
                          <p className="text-center py-3 text-gray-400 text-xs">
                            {lang === 'fr' ? 'Aucun frais défini pour ce programme.' : 'No fees defined for this program.'}
                          </p>
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                  <th className="text-left px-3 py-2 font-semibold text-gray-500">{lang === 'fr' ? 'Frais' : 'Fee'}</th>
                                  <th className="text-left px-3 py-2 font-semibold text-gray-500">{lang === 'fr' ? 'Type' : 'Type'}</th>
                                  <th className="text-right px-3 py-2 font-semibold text-gray-500">{lang === 'fr' ? 'Montant' : 'Amount'}</th>
                                  <th className="text-center px-3 py-2 font-semibold text-gray-500 w-8">*</th>
                                </tr>
                              </thead>
                              <tbody>
                                {program.fees.map(fee => (
                                  <tr key={fee.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 bg-white dark:bg-gray-800/50">
                                    <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{lang === 'fr' ? (fee.nameFr || fee.name) : fee.name}</td>
                                    <td className="px-3 py-2 text-gray-500">{FEE_TYPES.find(t => t.id === fee.type)?.[lang === 'fr' ? 'fr' : 'en'] || fee.type}</td>
                                    <td className="px-3 py-2 text-right font-bold" style={{ color: iconAndColor.color }}>
                                      {fee.currency === 'CDF' ? 'FC' : fee.currency === 'RWF' ? 'FRw' : '$'}{fee.amount}
                                    </td>
                                    <td className="px-3 py-2 text-center">{fee.required ? <span className="text-green-500">*</span> : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                                  <td colSpan={2} className="px-3 py-2 text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Total' : 'Total'}</td>
                                  <td className="px-3 py-2 text-right text-gray-900 dark:text-white">${feesTotal}</td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <Clock size={12} /> {lang === 'fr' ? 'Créneaux' : 'Class times'}
                            </span>
                            <button type="button" onClick={e => { e.stopPropagation(); setClassForm({ startTime: '', endTime: '', name: '', room: '' }); setClassModal(true); }}
                              className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                              <Plus size={12} /> {lang === 'fr' ? 'Ajouter' : 'Add'}
                            </button>
                          </div>
                          {programClasses.length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">{lang === 'fr' ? 'Aucun créneau.' : 'No classes.'}</p>
                          ) : (
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                    <th className="text-left px-2 py-1.5 font-semibold text-gray-500">{lang === 'fr' ? 'Début' : 'Start'}</th>
                                    <th className="text-left px-2 py-1.5 font-semibold text-gray-500">{lang === 'fr' ? 'Fin' : 'End'}</th>
                                    <th className="text-left px-2 py-1.5 font-semibold text-gray-500">{lang === 'fr' ? 'Salle' : 'Room'}</th>
                                    <th className="w-7 px-1 py-1.5" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {programClasses.map(cls => (
                                    <tr key={cls.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                      <td className="px-2 py-1.5 text-gray-900 dark:text-white">{cls.startTime}</td>
                                      <td className="px-2 py-1.5 text-gray-900 dark:text-white">{cls.endTime}</td>
                                      <td className="px-2 py-1.5 text-gray-500">{cls.room || '—'}</td>
                                      <td className="px-1 py-1.5">
                                        <button type="button" onClick={e => { e.stopPropagation(); deleteClass(cls.id); }} className="p-0.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                          <Trash2 size={11} />
                                        </button>
                                      </td>
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Add class modal (when a program is expanded) ─── */}
      <AnimatePresence>
        {classModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setClassModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl p-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{lang === 'fr' ? 'Nouveau créneau' : 'New class'}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Heure de début' : 'Start time'}</label>
                  <input type="text" value={classForm.startTime} onChange={e => setClassForm(f => ({ ...f, startTime: e.target.value }))}
                    placeholder="6:00" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Heure de fin' : 'End time'}</label>
                  <input type="text" value={classForm.endTime} onChange={e => setClassForm(f => ({ ...f, endTime: e.target.value }))}
                    placeholder="7:30" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Nom (optionnel)' : 'Name (optional)'}</label>
                  <input type="text" value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Morning class" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Salle (optionnel)' : 'Room (optional)'}</label>
                  <input type="text" value={classForm.room} onChange={e => setClassForm(f => ({ ...f, room: e.target.value }))}
                    placeholder="Room 101" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setClassModal(false)} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
                <button type="button" onClick={saveClass} disabled={savingClass || !classForm.startTime || !classForm.endTime}
                  className="flex-1 px-3 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1">
                  {savingClass ? <Loader2 size={14} className="animate-spin" /> : null}{lang === 'fr' ? 'Ajouter' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Add/Edit Program Modal ─── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">

              {/* Modal header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                  {modal === 'add'
                    ? (lang === 'fr' ? 'Nouveau Programme' : 'New Program')
                    : (lang === 'fr' ? 'Modifier le Programme' : 'Edit Program')}
                </h3>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              </div>

              {/* Modal body - scrollable */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {/* Program basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Département' : 'Department'} *</label>
                    <select
                      value={form.departmentId}
                      onChange={e => {
                        const d = departments.find(dep => dep.id === e.target.value);
                        setForm(f => ({ ...f, departmentId: e.target.value, department: d?.slug || '' }));
                      }}
                      className={inputCls}
                    >
                      <option value="">{lang === 'fr' ? 'Choisir…' : 'Select…'}</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{lang === 'fr' ? (d.name_fr || d.name) : d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))} className={inputCls}>
                      <option value="active">{lang === 'fr' ? 'Actif' : 'Active'}</option>
                      <option value="inactive">{lang === 'fr' ? 'Inactif' : 'Inactive'}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Nom (anglais)' : 'Name (English)'} *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Level 1" />
                  </div>
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Nom (français)' : 'Name (French)'}</label>
                    <input value={form.nameFr} onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))} className={inputCls} placeholder="ex: Niveau 1" />
                  </div>
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Durée (mois)' : 'Duration (months)'}</label>
                    <input type="number" min={0} value={form.durationMonths ?? 0} onChange={e => setForm(f => ({ ...f, durationMonths: Number(e.target.value) || 0 }))} className={inputCls} placeholder="12" />
                    <p className="text-xs text-gray-500 mt-0.5">{lang === 'fr' ? 'Utilisé pour le total des frais (mensuels × durée).' : 'Used for total fees (monthly × duration).'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Description (EN)' : 'Description (EN)'}</label>
                    <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{lang === 'fr' ? 'Description (FR)' : 'Description (FR)'}</label>
                    <input value={form.descriptionFr || ''} onChange={e => setForm(f => ({ ...f, descriptionFr: e.target.value }))} className={inputCls} />
                  </div>
                </div>

                {/* Fee structure section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                        {lang === 'fr' ? 'Structure des Frais' : 'Fee Structure'}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500">
                        {form.fees.length} {lang === 'fr' ? 'frais' : 'fees'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {feeStructures.length > 0 && (
                        <select
                          value=""
                          onChange={e => { const id = e.target.value; if (id) { const fs = feeStructures.find(x => x.id === id); if (fs) addFeeFromStructure(fs); e.target.value = ''; } }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                        >
                          <option value="">{lang === 'fr' ? 'Ajouter depuis une structure…' : 'Add from structure…'}</option>
                          {feeStructures.filter(fs => !form.fees.some(f => f.feeStructureId === fs.id)).map(fs => (
                            <option key={fs.id} value={fs.id}>{lang === 'fr' ? (fs.nameFr || fs.name) : fs.name} (${fs.amount})</option>
                          ))}
                        </select>
                      )}
                      <button onClick={addFee}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all"
                        style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        <Plus size={12} /> {lang === 'fr' ? 'Frais personnalisé' : 'Custom fee'}
                      </button>
                      {customFeesCount > 0 && (
                        <button
                          onClick={saveFeesToStructures}
                          disabled={savingToStructures}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-600 text-green-600 dark:text-green-400 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                        >
                          {savingToStructures ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
                          {lang === 'fr' ? `Enregistrer ${customFeesCount} frais en structure` : `Save ${customFeesCount} fee(s) to structures`}
                        </button>
                      )}
                    </div>
                  </div>

                  {form.fees.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <DollarSign size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-400 text-xs mb-2">
                        {lang === 'fr' ? 'Assignez des structures réutilisables (ex: Inscription, Carte étudiant) ou ajoutez un frais personnalisé.' : 'Assign reusable structures (e.g. Registration, Student card) or add a custom fee.'}
                      </p>
                      {feeStructures.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {lang === 'fr' ? 'Créez d\'abord des structures dans « Structure des Frais ».' : 'Create structures in Fee Structures first.'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.fees.map((fee, idx) => (
                        <motion.div key={fee.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-500">
                              {fee.feeStructureId ? (lang === 'fr' ? 'Structure' : 'From structure') : (lang === 'fr' ? `Frais #${idx + 1}` : `Fee #${idx + 1}`)}
                            </span>
                            <button onClick={() => removeFee(fee.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {fee.feeStructureId ? (
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {lang === 'fr' ? (fee.nameFr || fee.name) : fee.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500">{lang === 'fr' ? 'Montant (optionnel override)' : 'Amount (optional override)'}</label>
                                <input type="number" value={fee.amount} onChange={e => updateFee(fee.id, { amount: Number(e.target.value) })}
                                  className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" min={0} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className={labelCls}>{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'} *</label>
                                  <input value={fee.name} onChange={e => updateFee(fee.id, { name: e.target.value })}
                                    className={inputCls} placeholder="e.g. Registration Fee" />
                                </div>
                                <div>
                                  <label className={labelCls}>{lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'}</label>
                                  <input value={fee.nameFr} onChange={e => updateFee(fee.id, { nameFr: e.target.value })}
                                    className={inputCls} placeholder="ex: Frais d'inscription" />
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <label className={labelCls}>{lang === 'fr' ? 'Montant' : 'Amount'} *</label>
                                  <input type="number" value={fee.amount} onChange={e => updateFee(fee.id, { amount: Number(e.target.value) })}
                                    className={inputCls} min={0} />
                                </div>
                                <div>
                                  <label className={labelCls}>{lang === 'fr' ? 'Devise' : 'Currency'}</label>
                                  <select value={fee.currency} onChange={e => updateFee(fee.id, { currency: e.target.value })} className={inputCls}>
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className={labelCls}>Type</label>
                                  <select value={fee.type} onChange={e => updateFee(fee.id, { type: e.target.value as FeeType })} className={inputCls}>
                                    {FEE_TYPES.map(t => (
                                      <option key={t.id} value={t.id}>{lang === 'fr' ? t.fr : t.en}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className={labelCls}>{lang === 'fr' ? 'Obligatoire' : 'Required'}</label>
                                  <select value={fee.required ? 'yes' : 'no'} onChange={e => updateFee(fee.id, { required: e.target.value === 'yes' })} className={inputCls}>
                                    <option value="yes">{lang === 'fr' ? 'Oui' : 'Yes'}</option>
                                    <option value="no">{lang === 'fr' ? 'Non' : 'No'}</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}

                      {/* Fee total summary */}
                      <div className="flex justify-end px-4 py-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Total: ${form.fees.reduce((s, f) => s + f.amount, 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle size={14} /> {error}
                    </div>
                    {isSessionError(error) && (
                      <Link
                        to="/login"
                        onClick={(ev) => { ev.preventDefault(); handleLogInAgain(); }}
                        className="inline-flex items-center gap-1 text-sm font-medium"
                        style={{ color: 'var(--btc-primary,#16a34a)' }}
                      >
                        {lang === 'fr' ? 'Se reconnecter' : 'Log in again'}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  style={{ background: 'var(--btc-primary,#16a34a)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
