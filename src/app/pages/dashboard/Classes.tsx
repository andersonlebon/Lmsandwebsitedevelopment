import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, BookOpen, Building2, CalendarDays, Loader2, Filter, Plus, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { ExportReportButton } from '../../components/ExportReportButton';

interface ClassRow {
  id: string;
  programId: string;
  code?: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number | null;
  daysOfWeek: number[];
  room: string;
  sortOrder: number;
  programName?: string;
  programNameFr?: string;
  departmentId?: string;
  departmentName?: string;
  departmentNameFr?: string;
  departmentSlug?: string;
}

const DAY_NAMES: Record<number, { en: string; fr: string }> = {
  1: { en: 'Monday', fr: 'Lundi' },
  2: { en: 'Tuesday', fr: 'Mardi' },
  3: { en: 'Wednesday', fr: 'Mercredi' },
  4: { en: 'Thursday', fr: 'Jeudi' },
  5: { en: 'Friday', fr: 'Vendredi' },
  6: { en: 'Saturday', fr: 'Samedi' },
  7: { en: 'Sunday', fr: 'Dimanche' },
};

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export function Classes() {
  const { lang } = useLanguage();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; name_fr?: string; slug: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr?: string; departmentId?: string }[]>([]);
  const [promotions, setPromotions] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    programId: '',
    name: '',
    startTime: '08:00',
    endTime: '10:00',
    room: '',
    daysOfWeek: [] as number[],
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [deptRes, progRes, promoRes] = await Promise.all([
          apiFetch('/departments', { requireAuth: true }),
          apiFetch('/programs', { requireAuth: true }),
          apiFetch('/promotions', { requireAuth: true }),
        ]);
        setDepartments(deptRes.departments || []);
        setPrograms(progRes.programs || []);
        setPromotions(promoRes.promotions || []);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (deptFilter) params.set('departmentId', deptFilter);
        if (programFilter) params.set('programId', programFilter);
        if (promoFilter) params.set('promotionId', promoFilter);
        const url = params.toString() ? `/classes?${params}` : '/classes';
        const data = await apiFetch(url, { requireAuth: true });
        setClasses(data.classes || []);
      } catch (e) {
        console.error(e);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [deptFilter, programFilter, promoFilter]);

  const dayLabel = (d: number | null) => (d != null ? DAY_NAMES[d]?.[lang === 'fr' ? 'fr' : 'en'] || String(d) : '—');
  const daysLabel = (days: number[]) =>
    days.length ? days.sort((a, b) => a - b).map((d) => DAY_NAMES[d]?.[lang === 'fr' ? 'fr' : 'en'] || d).join(', ') : '—';

  const toggleDay = (day: number) => {
    setAddForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day) ? f.daysOfWeek.filter((d) => d !== day) : [...f.daysOfWeek, day].sort((a, b) => a - b),
    }));
  };

  const openAddModal = () => {
    setAddForm({
      programId: programFilter || programs[0]?.id || '',
      name: '',
      startTime: '08:00',
      endTime: '10:00',
      room: '',
      daysOfWeek: [],
    });
    setAddError('');
    setShowAddModal(true);
  };

  const saveNewClass = async () => {
    if (!addForm.programId) {
      setAddError(lang === 'fr' ? 'Choisissez un programme.' : 'Select a program.');
      return;
    }
    if (addForm.daysOfWeek.length === 0) {
      setAddError(lang === 'fr' ? 'Sélectionnez au moins un jour.' : 'Select at least one day.');
      return;
    }
    setAddSaving(true);
    setAddError('');
    try {
      await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify({
          programId: addForm.programId,
          name: addForm.name || undefined,
          startTime: addForm.startTime,
          endTime: addForm.endTime,
          room: addForm.room || undefined,
          daysOfWeek: addForm.daysOfWeek,
        }),
        requireAuth: true,
      });
      setShowAddModal(false);
      const params = new URLSearchParams();
      if (deptFilter) params.set('departmentId', deptFilter);
      if (programFilter) params.set('programId', programFilter);
      if (promoFilter) params.set('promotionId', promoFilter);
      const url = params.toString() ? `/classes?${params}` : '/classes';
      const data = await apiFetch(url, { requireAuth: true });
      setClasses(data.classes || []);
    } catch (e: any) {
      setAddError(e.message || (lang === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save'));
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Classes' : 'Classes'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {lang === 'fr' ? 'Tous les créneaux par département, programme et promotion' : 'All class slots filterable by department, program and promotion'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--btc-primary,#16a34a)' }}
          >
            <Plus size={18} /> {lang === 'fr' ? 'Nouvelle classe' : 'Add class'}
          </button>
          <ExportReportButton
            data={classes.map((c) => ({
              Department: lang === 'fr' ? (c.departmentNameFr ?? c.departmentName) : c.departmentName,
              Program: lang === 'fr' ? (c.programNameFr ?? c.programName) : c.programName,
              Code: c.code || '—',
              Class: c.name || `${c.startTime}-${c.endTime}`,
              Day: daysLabel(c.daysOfWeek ?? (c.dayOfWeek != null ? [c.dayOfWeek] : [])),
              'Start': c.startTime,
              'End': c.endTime,
              Room: c.room || '—',
            }))}
            filename="classes"
            compact
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-gray-500" />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
        >
          <option value="">{lang === 'fr' ? 'Tous les départements' : 'All departments'}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{lang === 'fr' ? (d.name_fr || d.name) : d.name}</option>
          ))}
        </select>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
        >
          <option value="">{lang === 'fr' ? 'Tous les programmes' : 'All programs'}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{lang === 'fr' ? (p.nameFr || p.name) : p.name}</option>
          ))}
        </select>
        <select
          value={promoFilter}
          onChange={(e) => setPromoFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
        >
          <option value="">{lang === 'fr' ? 'Toutes les promotions' : 'All promotions'}</option>
          {promotions.map((p) => (
            <option key={p.id} value={p.id}>{lang === 'fr' ? (p.nameFr || p.name) : p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Clock size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Aucune classe trouvée.' : 'No classes found.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Code' : 'Code'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Département' : 'Department'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Programme' : 'Program'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Créneau' : 'Slot'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Jour' : 'Day'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Heure' : 'Time'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Salle' : 'Room'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{c.code || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {lang === 'fr' ? (c.departmentNameFr ?? c.departmentName) : c.departmentName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lang === 'fr' ? (c.programNameFr ?? c.programName) : c.programName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{daysLabel(c.daysOfWeek ?? (c.dayOfWeek != null ? [c.dayOfWeek] : []))}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.startTime} – {c.endTime}</td>
                    <td className="px-4 py-3 text-gray-500">{c.room || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddModal(false)}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lang === 'fr' ? 'Nouvelle classe' : 'Add class'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {lang === 'fr'
                ? 'Une seule classe est créée. Choisissez les jours où elle a lieu ; le calendrier affichera un événement par jour (même heure et salle).'
                : 'One class is created. Select the days it runs; the calendar will show one event per day (same time and room).'}
            </p>
            {addError && <p className="text-sm text-red-500 mb-3">{addError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Programme' : 'Program'} *</label>
                <select
                  value={addForm.programId}
                  onChange={(e) => setAddForm((f) => ({ ...f, programId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">—</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{lang === 'fr' ? (p.nameFr || p.name) : p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Nom du créneau' : 'Slot name'}</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={lang === 'fr' ? 'Ex: Cours du matin' : 'e.g. Morning class'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Heure début' : 'Start time'}</label>
                  <input
                    type="time"
                    value={addForm.startTime}
                    onChange={(e) => setAddForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Heure fin' : 'End time'}</label>
                  <input
                    type="time"
                    value={addForm.endTime}
                    onChange={(e) => setAddForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'fr' ? 'Salle' : 'Room'}</label>
                <input
                  type="text"
                  value={addForm.room}
                  onChange={(e) => setAddForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="e.g. Room A"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'fr' ? 'Jours de la semaine' : 'Days of the week'} *</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <label key={day} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.daysOfWeek.includes(day)}
                        onChange={() => toggleDay(day)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{DAY_NAMES[day][lang === 'fr' ? 'fr' : 'en']}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={saveNewClass} disabled={addSaving} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                {addSaving && <Loader2 size={16} className="animate-spin" />}
                {lang === 'fr' ? 'Créer la classe' : 'Create class'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
