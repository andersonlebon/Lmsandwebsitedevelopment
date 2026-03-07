import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, MapPin, BookOpen, Search, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const classes: any[] = [];

export function StaffClasses() {
  const { t, lang } = useLanguage();
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('staff.myClasses')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Gérez vos cours et étudiants' : 'Manage your classes and students'}</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search') + '...'}
            className="pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-64" />
        </div>
      </div>

      <div className="space-y-4">
        {classes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>{lang === 'fr' ? 'Aucun cours assigné pour le moment.' : 'No classes assigned yet.'}</p>
          </div>
        )}
        {classes.map((cls, i) => (
          <motion.div key={cls.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.1)' }}>
                  <BookOpen size={20} style={{ color: 'var(--btc-primary,#2563eb)' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{cls.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Clock size={11} /> {cls.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {cls.room}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {cls.total} {lang === 'fr' ? 'étudiants' : 'students'}</span>
                  </div>
                </div>
              </div>
              {expandedClass === cls.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            <AnimatePresence>
              {expandedClass === cls.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-400 uppercase px-3 mb-2">
                      <span className="col-span-5">{lang === 'fr' ? 'Nom' : 'Name'}</span>
                      <span className="col-span-3">ID</span>
                      <span className="col-span-2">{lang === 'fr' ? 'Présence' : 'Attendance'}</span>
                      <span className="col-span-2">{t('common.status')}</span>
                    </div>
                    {cls.students.filter((s: any) => !search || s.name.toLowerCase().includes(search.toLowerCase())).map((s: any, j: number) => (
                      <div key={j} className="grid grid-cols-12 gap-4 items-center px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                        <div className="col-span-5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--btc-primary,#2563eb)' }}>{s.name.charAt(0)}</div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                        </div>
                        <span className="col-span-3 text-xs font-mono text-gray-500">{s.id}</span>
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-10 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${s.attendance}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{s.attendance}%</span>
                        </div>
                        <span className="col-span-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center gap-1 w-fit">
                            <CheckCircle size={10} /> {t('common.active')}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
