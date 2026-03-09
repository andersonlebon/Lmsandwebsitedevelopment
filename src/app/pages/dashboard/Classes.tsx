import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, BookOpen, Building2, CalendarDays, Loader2, Filter } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { ExportReportButton } from '../../components/ExportReportButton';

interface ClassRow {
  id: string;
  programId: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number | null;
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
        <ExportReportButton
          data={classes.map((c) => ({
            Department: lang === 'fr' ? (c.departmentNameFr ?? c.departmentName) : c.departmentName,
            Program: lang === 'fr' ? (c.programNameFr ?? c.programName) : c.programName,
            Class: c.name || `${c.startTime}-${c.endTime}`,
            Day: dayLabel(c.dayOfWeek),
            'Start': c.startTime,
            'End': c.endTime,
            Room: c.room || '—',
          }))}
          filename="classes"
          compact
        />
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
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {lang === 'fr' ? (c.departmentNameFr ?? c.departmentName) : c.departmentName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lang === 'fr' ? (c.programNameFr ?? c.programName) : c.programName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{dayLabel(c.dayOfWeek)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.startTime} – {c.endTime}</td>
                    <td className="px-4 py-3 text-gray-500">{c.room || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
