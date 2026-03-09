import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function StaffSchedules() {
  const { lang } = useLanguage();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().slice(0, 10);
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ staffId: '', classId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [weekStart]);

  const load = async () => {
    setLoading(true);
    try {
      const [schedRes, staffRes, classRes] = await Promise.all([
        apiFetch(`/staff-schedules?weekStart=${weekStart}`, { requireAuth: true }),
        apiFetch('/staff', { requireAuth: true }),
        apiFetch('/classes', { requireAuth: true }),
      ]);
      setSchedules(schedRes.schedules || []);
      setStaff(staffRes.staff || []);
      setClasses(classRes.classes || []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.staffId || !form.classId) return;
    setSaving(true);
    try {
      await apiFetch('/staff-schedules', {
        method: 'POST',
        body: JSON.stringify({ ...form, weekStart }),
        requireAuth: true,
      });
      setShowAdd(false);
      setForm({ staffId: '', classId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce créneau ?' : 'Delete this schedule slot?')) return;
    try {
      await apiFetch(`/staff-schedules/${id}`, { method: 'DELETE', requireAuth: true });
      load();
    } catch (e: any) {
      alert(e.message || 'Failed');
    }
  };

  const staffName = (id: string) => staff.find(s => s.id === id)?.name || id?.slice(0, 8);
  const className = (id: string) => classes.find(c => c.id === id)?.name || id?.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
          {lang === 'fr' ? 'Plannings staff' : 'Staff schedules'}
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Semaine du' : 'Week of'}</label>
          <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          />
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
            <Plus size={18} /> {lang === 'fr' ? 'Ajouter' : 'Add'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Staff' : 'Staff'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Classe' : 'Class'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Jour' : 'Day'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Heure' : 'Time'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Salle' : 'Room'}</th>
                <th className="px-6 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {schedules.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">{lang === 'fr' ? 'Aucun créneau cette semaine' : 'No slots this week'}</td></tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{staffName(s.staffId)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{className(s.classId)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{DAYS[s.dayOfWeek - 1] ?? s.dayOfWeek}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{s.startTime} – {s.endTime}</td>
                    <td className="px-6 py-3 text-gray-500">{s.room || '—'}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                    </td>
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
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{lang === 'fr' ? 'Nouveau créneau' : 'New schedule slot'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Staff' : 'Staff'}</label>
                <select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  <option value="">—</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Classe' : 'Class'}</label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  <option value="">—</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.programName ? `(${c.programName})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Jour (1–7)' : 'Day (1–7)'}</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Début' : 'Start'}</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Fin' : 'End'}</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Salle' : 'Room'}</label>
                <input type="text" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={handleAdd} disabled={saving || !form.staffId || !form.classId} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
