import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Plus, Search, Edit2, Trash2, Eye, X, Mail, Phone, Calendar, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useStaff, useDepartments, deleteStaffMember, updateStaffMember, createStaffMember, type StaffProfile } from '../../hooks/useBTC';

const ROLE_COLORS: Record<string, string> = { admin: '#7c3aed', staff: '#16a34a' };

export function Staff() {
  const { lang } = useLanguage();
  const { staff, isLoading, mutate } = useStaff();
  const { departments } = useDepartments();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<StaffProfile | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'staff' as string, department_id: '', specialization: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const filtered = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || s.department_id === deptFilter;
    return matchSearch && matchDept;
  });

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', password: '', role: 'staff', department_id: '', specialization: '', is_active: true });
    setSaveError('');
    setModal('add');
  };
  const openEdit = (s: StaffProfile) => {
    setSelected(s);
    setForm({ name: s.name, email: s.email, phone: s.phone, password: '', role: s.role, department_id: s.department_id || '', specialization: s.specialization || '', is_active: s.is_active });
    setSaveError('');
    setModal('edit');
  };
  const openView = (s: StaffProfile) => { setSelected(s); setModal('view'); };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce membre du personnel ?' : 'Remove this staff member?')) return;
    try {
      await deleteStaffMember(id);
      mutate();
    } catch (e: any) {
      console.error('Delete staff error:', e);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { setSaveError(lang === 'fr' ? 'Nom et email requis' : 'Name and email required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      if (modal === 'add') {
        if (!form.password || form.password.length < 6) { setSaveError(lang === 'fr' ? 'Mot de passe requis (min 6)' : 'Password required (min 6 chars)'); setSaving(false); return; }
        await createStaffMember({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          phone: form.phone,
          department: departments.find(d => d.id === form.department_id)?.name || '',
        });
      } else if (modal === 'edit' && selected) {
        await updateStaffMember(selected.id, {
          name: form.name,
          phone: form.phone,
          role: form.role,
          department_id: form.department_id || null,
          specialization: form.specialization,
          is_active: form.is_active,
        });
      }
      mutate();
      setModal(null);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return '—';
    const dept = departments.find(d => d.id === deptId);
    return dept ? (lang === 'fr' ? dept.name_fr : dept.name) : '—';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Gestion du Personnel' : 'Staff Management'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{staff.length} {lang === 'fr' ? 'membres' : 'staff members'}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            <Plus size={16} /> {lang === 'fr' ? 'Ajouter' : 'Add Staff'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Personnel' : 'Total Staff', value: staff.length, color: '#16a34a' },
          { label: 'Admins', value: staff.filter(s => s.role === 'admin').length, color: '#7c3aed' },
          { label: lang === 'fr' ? 'Personnel' : 'Staff', value: staff.filter(s => s.role === 'staff').length, color: '#2563eb' },
          { label: lang === 'fr' ? 'Actifs' : 'Active', value: staff.filter(s => s.is_active).length, color: '#ea580c' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins', color: c.color }}>{c.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
            placeholder={lang === 'fr' ? 'Rechercher...' : 'Search staff...'} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500">
          <option value="all">{lang === 'fr' ? 'Tous les départements' : 'All Departments'}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{lang === 'fr' ? d.name_fr : d.name}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <UserCog size={40} className="text-gray-300 mb-4" />
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1">{lang === 'fr' ? 'Aucun personnel' : 'No staff yet'}</h3>
          <button onClick={openAdd} className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            <Plus size={16} /> {lang === 'fr' ? 'Ajouter' : 'Add Staff'}
          </button>
        </motion.div>
      )}

      {/* Grid Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filtered.map((s, i) => {
            const roleColor = ROLE_COLORS[s.role] || '#64748b';
            return (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: roleColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {s.is_active ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Inactif' : 'Inactive')}
                  </span>
                </div>
                <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5" style={{ fontFamily: 'Poppins' }}>{s.name}</h4>
                <p className="text-xs font-medium mb-1 capitalize" style={{ color: roleColor }}>{s.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{getDeptName(s.department_id)}</p>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1.5 truncate"><Mail size={11} />{s.email}</div>
                  {s.phone && <div className="flex items-center gap-1.5"><Phone size={11} />{s.phone}</div>}
                  <div className="flex items-center gap-1.5"><Calendar size={11} />{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => openView(s)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><Eye size={13} /></button>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500 transition-colors"><Edit2 size={13} /></button>
                  {!s.is_super_admin && <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={13} /></button>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>
                  {modal === 'add' ? (lang === 'fr' ? 'Ajouter du Personnel' : 'Add Staff Member') : modal === 'edit' ? (lang === 'fr' ? 'Modifier' : 'Edit Staff') : (lang === 'fr' ? 'Détails' : 'Staff Details')}
                </h3>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} className="text-gray-500" /></button>
              </div>
              <div className="p-6">
                {modal === 'view' && selected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: ROLE_COLORS[selected.role] || '#16a34a' }}>{selected.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{selected.name}</h4>
                        <p className="text-sm capitalize" style={{ color: ROLE_COLORS[selected.role] || '#16a34a' }}>{selected.role}</p>
                      </div>
                    </div>
                    {[
                      ['Email', selected.email],
                      [lang === 'fr' ? 'Téléphone' : 'Phone', selected.phone || '—'],
                      [lang === 'fr' ? 'Département' : 'Department', getDeptName(selected.department_id)],
                      [lang === 'fr' ? 'Spécialisation' : 'Specialization', selected.specialization || '—'],
                      [lang === 'fr' ? 'Date d\'embauche' : 'Hire Date', selected.hire_date || '—'],
                      [lang === 'fr' ? 'Inscrit' : 'Joined', new Date(selected.created_at).toLocaleDateString()],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                        <span className="text-gray-500">{k}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saveError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-sm">{saveError}</div>}
                    {[['Full Name', 'name', 'text', 'Dr. Jane Doe'], ['Email', 'email', 'email', 'jane@btc-goma.cd'], ['Phone', 'phone', 'tel', '+243 99 000 0000']].map(([lbl, key, type, ph]) => (
                      <div key={key as string}>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lbl}</label>
                        <input type={type as string} value={(form as any)[key as string]} onChange={e => setForm(v => ({ ...v, [key as string]: e.target.value }))}
                          placeholder={ph as string} disabled={key === 'email' && modal === 'edit'}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 disabled:opacity-50" />
                      </div>
                    ))}
                    {modal === 'add' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Mot de passe' : 'Password'}</label>
                        <input type="password" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} placeholder="Min 6 characters"
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Role</label>
                        <select value={form.role} onChange={e => setForm(v => ({ ...v, role: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500">
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Département' : 'Department'}</label>
                        <select value={form.department_id} onChange={e => setForm(v => ({ ...v, department_id: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500">
                          <option value="">{lang === 'fr' ? 'Aucun' : 'None'}</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{lang === 'fr' ? d.name_fr : d.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Spécialisation' : 'Specialization'}</label>
                      <input value={form.specialization} onChange={e => setForm(v => ({ ...v, specialization: e.target.value }))} placeholder="e.g. English Teacher"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                    </div>
                    {modal === 'edit' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
                        <select value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm(v => ({ ...v, is_active: e.target.value === 'active' }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500">
                          <option value="active">{lang === 'fr' ? 'Actif' : 'Active'}</option>
                          <option value="inactive">{lang === 'fr' ? 'Inactif' : 'Inactive'}</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {modal === 'add' ? (lang === 'fr' ? 'Ajouter' : 'Add Staff') : (lang === 'fr' ? 'Enregistrer' : 'Save Changes')}
                      </button>
                      <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
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
