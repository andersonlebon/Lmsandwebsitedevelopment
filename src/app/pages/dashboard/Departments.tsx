import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Users, GraduationCap, Car, Scissors, Monitor, Plus, Settings,
  Loader2, X, Edit2, Trash2, Eye, Building2
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useDepartments, useStudents, useStaff, usePrograms,
  createDepartment, updateDepartment, deleteDepartment,
  type Department
} from '../../hooks/useBTC';

const ICON_OPTIONS = [
  { value: 'Languages', label: 'Languages', Icon: GraduationCap },
  { value: 'Monitor', label: 'Computer / IT', Icon: Monitor },
  { value: 'Car', label: 'Driving / Auto', Icon: Car },
  { value: 'Scissors', label: 'Sewing / Fashion', Icon: Scissors },
  { value: 'BookOpen', label: 'General', Icon: BookOpen },
  { value: 'Building2', label: 'Administration', Icon: Building2 },
];

const COLOR_OPTIONS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#16a34a',
  '#ea580c', '#0891b2', '#dc2626', '#6366f1', '#10b981',
];

const ICON_MAP: Record<string, any> = {
  Languages: GraduationCap,
  Monitor: Monitor,
  Car: Car,
  Scissors: Scissors,
  BookOpen: BookOpen,
  Building2: Building2,
};

const BLANK_FORM = {
  name: '',
  name_fr: '',
  slug: '',
  description: '',
  description_fr: '',
  icon: 'BookOpen',
  color: '#3b82f6',
  is_active: true,
  sort_order: 0,
};

export function Departments() {
  const { t, lang } = useLanguage();
  const { departments, isLoading: loadingDepts, mutate } = useDepartments();
  const { students } = useStudents();
  const { staff } = useStaff();
  const { programs } = usePrograms();

  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (loadingDepts) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-gray-400" /></div>;
  }

  const totalStudents = students.length;
  const totalStaff = staff.length;
  const totalPrograms = programs.length;

  const deptData = departments.map(dept => {
    const deptStudents = students.filter(s => s.department_id === dept.id).length;
    const deptStaff = staff.filter(s => s.department_id === dept.id).length;
    const deptPrograms = programs.filter(p => p.department_id === dept.id);
    const IconComponent = ICON_MAP[dept.icon] || BookOpen;
    return { ...dept, deptStudents, deptStaff, deptPrograms, IconComponent };
  });

  // ── Handlers ──
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openAdd = () => {
    setForm({ ...BLANK_FORM, sort_order: departments.length + 1 });
    setSaveError('');
    setModal('add');
  };

  const openEdit = (d: Department) => {
    setSelected(d);
    setForm({
      name: d.name,
      name_fr: d.name_fr,
      slug: d.slug,
      description: d.description,
      description_fr: d.description_fr,
      icon: d.icon || 'BookOpen',
      color: d.color || '#3b82f6',
      is_active: d.is_active,
      sort_order: d.sort_order,
    });
    setSaveError('');
    setModal('edit');
  };

  const openView = (d: Department) => { setSelected(d); setModal('view'); };

  const handleDelete = async (id: string) => {
    const dept = departments.find(d => d.id === id);
    const label = dept ? (lang === 'fr' ? dept.name_fr : dept.name) : '';
    if (!confirm(lang === 'fr' ? `Supprimer le département "${label}" ?` : `Delete department "${label}"?`)) return;
    try {
      await deleteDepartment(id);
      mutate();
    } catch (e: any) {
      console.error('Delete department error:', e);
      alert(e.message || 'Failed to delete');
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      setSaveError(lang === 'fr' ? 'Le nom est requis' : 'Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: form.name,
        name_fr: form.name_fr || form.name,
        slug: form.slug || autoSlug(form.name),
        description: form.description,
        description_fr: form.description_fr,
        icon: form.icon,
        color: form.color,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (modal === 'add') {
        await createDepartment(payload);
      } else if (modal === 'edit' && selected) {
        await updateDepartment(selected.id, payload);
      }
      mutate();
      setModal(null);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──
  const SelectedIcon = ICON_MAP[form.icon] || BookOpen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('dept.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dept.manage')}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: 'var(--btc-primary,#16a34a)' }}>
          <Plus size={16} /> {lang === 'fr' ? 'Ajouter Département' : 'Add Department'}
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Départements' : 'Total Departments', value: String(departments.length), color: '#2563eb' },
          { label: lang === 'fr' ? 'Total Programmes' : 'Total Programs', value: String(totalPrograms), color: '#16a34a' },
          { label: lang === 'fr' ? 'Total Étudiants' : 'Total Students', value: String(totalStudents), color: '#7c3aed' },
          { label: lang === 'fr' ? 'Total Personnel' : 'Total Staff', value: String(totalStaff), color: '#ea580c' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700, color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {departments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Aucun département' : 'No departments yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {lang === 'fr' ? 'Créez votre premier département pour commencer.' : 'Create your first department to get started.'}
          </p>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            <Plus size={16} /> {lang === 'fr' ? 'Ajouter' : 'Add Department'}
          </button>
        </motion.div>
      )}

      {/* Department cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {deptData.map((dept, di) => (
          <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${dept.color}15` }}>
                    <dept.IconComponent size={20} style={{ color: dept.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                      {lang === 'fr' ? dept.name_fr : dept.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {dept.deptPrograms.length} {lang === 'fr' ? 'programmes' : 'programs'} · {dept.deptStaff} {lang === 'fr' ? 'personnel' : 'staff'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(dept)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-colors"><Eye size={15} /></button>
                  <button onClick={() => openEdit(dept)} className="p-2 rounded-lg text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-500 transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(dept.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{dept.deptStudents}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.students')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{dept.deptStaff}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.staff')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-lg font-bold" style={{ fontFamily: 'Poppins', color: dept.color }}>{dept.deptPrograms.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Programmes' : 'Programs'}</p>
                </div>
              </div>
            </div>
            {/* Programs list */}
            <div className="p-4 space-y-2">
              {dept.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">{lang === 'fr' ? dept.description_fr || dept.description : dept.description}</p>
              )}
              {dept.deptPrograms.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">{lang === 'fr' ? 'Aucun programme' : 'No programs yet'}</p>
              ) : (
                dept.deptPrograms.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{lang === 'fr' ? p.name_fr || p.name : p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{p.duration || '—'}</span>
                      <span className="text-xs font-semibold" style={{ color: dept.color }}>${p.total_fee_usd || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════ Modal ═══════════════ */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg" style={{ fontFamily: 'Poppins' }}>
                  {modal === 'add'
                    ? (lang === 'fr' ? 'Nouveau Département' : 'New Department')
                    : modal === 'edit'
                      ? (lang === 'fr' ? 'Modifier le Département' : 'Edit Department')
                      : (lang === 'fr' ? 'Détails du Département' : 'Department Details')}
                </h3>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">

                {/* ─── VIEW MODE ─── */}
                {modal === 'view' && selected && (() => {
                  const ViewIcon = ICON_MAP[selected.icon] || BookOpen;
                  const deptStudents = students.filter(s => s.department_id === selected.id).length;
                  const deptStaff2 = staff.filter(s => s.department_id === selected.id).length;
                  const deptProgs = programs.filter(p => p.department_id === selected.id);
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${selected.color}15` }}>
                          <ViewIcon size={28} style={{ color: selected.color }} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>
                            {lang === 'fr' ? selected.name_fr : selected.name}
                          </h4>
                          <p className="text-xs text-gray-400 font-mono">{selected.slug}</p>
                        </div>
                      </div>

                      {(selected.description || selected.description_fr) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {lang === 'fr' ? selected.description_fr || selected.description : selected.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                          <p className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: selected.color }}>{deptStudents}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.students')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                          <p className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: selected.color }}>{deptStaff2}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.staff')}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                          <p className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: selected.color }}>{deptProgs.length}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Programmes' : 'Programs'}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        {[
                          [lang === 'fr' ? 'Nom (EN)' : 'Name (EN)', selected.name],
                          [lang === 'fr' ? 'Nom (FR)' : 'Name (FR)', selected.name_fr],
                          ['Slug', selected.slug],
                          [lang === 'fr' ? 'Couleur' : 'Color', selected.color],
                          [lang === 'fr' ? 'Icône' : 'Icon', selected.icon],
                          ['Status', selected.is_active ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Inactif' : 'Inactive')],
                          [lang === 'fr' ? 'Créé le' : 'Created', new Date(selected.created_at).toLocaleDateString()],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">{k}</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button onClick={() => { openEdit(selected); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium hover:opacity-90 text-sm"
                          style={{ background: 'var(--btc-primary,#16a34a)' }}>
                          <Edit2 size={14} /> {lang === 'fr' ? 'Modifier' : 'Edit'}
                        </button>
                        <button onClick={() => setModal(null)}
                          className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                          {lang === 'fr' ? 'Fermer' : 'Close'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ─── ADD / EDIT FORM ─── */}
                {(modal === 'add' || modal === 'edit') && (
                  <div className="space-y-4">
                    {saveError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-sm">
                        {saveError}
                      </div>
                    )}

                    {/* Preview */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100/80 dark:bg-gray-700/70 border border-gray-200/50 dark:border-gray-600/50">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${form.color}15` }}>
                        <SelectedIcon size={20} style={{ color: form.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{form.name || (lang === 'fr' ? 'Nom du département' : 'Department Name')}</p>
                        <p className="text-xs text-gray-400 truncate">{form.slug || autoSlug(form.name || 'slug')}</p>
                      </div>
                    </div>

                    {/* Name EN */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {lang === 'fr' ? 'Nom (Anglais) *' : 'Name (English) *'}
                      </label>
                      <input value={form.name}
                        onChange={e => {
                          const name = e.target.value;
                          setForm(v => ({ ...v, name, slug: modal === 'add' ? autoSlug(name) : v.slug }));
                        }}
                        placeholder="e.g. Computer Science"
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors" />
                    </div>

                    {/* Name FR */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {lang === 'fr' ? 'Nom (Français) *' : 'Name (French) *'}
                      </label>
                      <input value={form.name_fr}
                        onChange={e => setForm(v => ({ ...v, name_fr: e.target.value }))}
                        placeholder="ex: Informatique"
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors" />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Slug</label>
                      <input value={form.slug}
                        onChange={e => setForm(v => ({ ...v, slug: e.target.value }))}
                        placeholder="computer-science"
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 font-mono transition-colors" />
                    </div>

                    {/* Description EN */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {lang === 'fr' ? 'Description (Anglais)' : 'Description (English)'}
                      </label>
                      <textarea value={form.description}
                        onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
                        rows={2}
                        placeholder={lang === 'fr' ? 'Description en anglais...' : 'English description...'}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 resize-none transition-colors" />
                    </div>

                    {/* Description FR */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {lang === 'fr' ? 'Description (Français)' : 'Description (French)'}
                      </label>
                      <textarea value={form.description_fr}
                        onChange={e => setForm(v => ({ ...v, description_fr: e.target.value }))}
                        rows={2}
                        placeholder={lang === 'fr' ? 'Description en français...' : 'French description...'}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 resize-none transition-colors" />
                    </div>

                    {/* Icon picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {lang === 'fr' ? 'Icône' : 'Icon'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map(opt => {
                          const active = form.icon === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              onClick={() => setForm(v => ({ ...v, icon: opt.value }))}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                active
                                  ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                              }`}>
                              <opt.Icon size={16} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Color picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {lang === 'fr' ? 'Couleur' : 'Color'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c} type="button"
                            onClick={() => setForm(v => ({ ...v, color: c }))}
                            className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'}`}
                            style={{ background: c }} />
                        ))}
                        {/* Custom color */}
                        <div className="relative">
                          <input type="color" value={form.color}
                            onChange={e => setForm(v => ({ ...v, color: e.target.value }))}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 appearance-none"
                            title={lang === 'fr' ? 'Couleur personnalisée' : 'Custom color'} />
                        </div>
                      </div>
                    </div>

                    {/* Sort order + Active */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          {lang === 'fr' ? 'Ordre d\'affichage' : 'Sort Order'}
                        </label>
                        <input type="number" min={0} value={form.sort_order}
                          onChange={e => setForm(v => ({ ...v, sort_order: Number(e.target.value) }))}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
                        <select value={form.is_active ? 'active' : 'inactive'}
                          onChange={e => setForm(v => ({ ...v, is_active: e.target.value === 'active' }))}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors">
                          <option value="active">{lang === 'fr' ? 'Actif' : 'Active'}</option>
                          <option value="inactive">{lang === 'fr' ? 'Inactif' : 'Inactive'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                        style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {modal === 'add'
                          ? (lang === 'fr' ? 'Créer le Département' : 'Create Department')
                          : (lang === 'fr' ? 'Enregistrer' : 'Save Changes')}
                      </button>
                      <button onClick={() => setModal(null)}
                        className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                        {lang === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
