import { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, Clock, QrCode, Users, Save } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const students: any[] = [];

export function StaffAttendance() {
  const { t, lang } = useLanguage();
  const [selectedClass, setSelectedClass] = useState('English Level 2 — Group A');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const mark = (id: string, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    setSaved(false);
  };

  const markAllPresent = () => {
    const all: Record<string, string> = {};
    students.forEach(s => { all[s.id] = 'present'; });
    setAttendance(all);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const markedCount = Object.keys(attendance).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('att.markAttendance')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Marquez la présence de vos étudiants' : 'Mark attendance for your students'}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <QrCode size={16} /> {t('att.scanQR')}
        </button>
      </div>

      {/* Class selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {['English Level 2 — Group A', 'English Level 1 — Group B', 'English TOT'].map(cls => (
          <button key={cls} onClick={() => setSelectedClass(cls)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedClass === cls ? 'text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
            style={selectedClass === cls ? { background: 'var(--btc-primary,#2563eb)' } : {}}>
            {cls}
          </button>
        ))}
      </div>

      {/* Attendance marking */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} style={{ color: 'var(--btc-primary,#2563eb)' }} />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedClass}</span>
            <span className="text-xs text-gray-400 ml-2">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={markAllPresent} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors">
              {lang === 'fr' ? 'Tous présents' : 'Mark all present'}
            </button>
            <span className="text-xs text-gray-400">{markedCount}/{students.length}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {students.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p>{lang === 'fr' ? 'Aucun étudiant dans ce cours.' : 'No students in this class.'}</p>
            </div>
          )}
          {students.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--btc-primary,#2563eb)' }}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { val: 'present', icon: CheckCircle, color: 'green', label: t('att.present') },
                  { val: 'late', icon: Clock, color: 'yellow', label: t('att.late') },
                  { val: 'absent', icon: XCircle, color: 'red', label: t('att.absent') },
                ].map(opt => {
                  const active = attendance[s.id] === opt.val;
                  return (
                    <button key={opt.val} onClick={() => mark(s.id, opt.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border ${
                        active
                          ? opt.color === 'green' ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                          : opt.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'
                      }`}>
                      <opt.icon size={12} /> {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {Object.values(attendance).filter(v => v === 'present').length} {t('att.present')}</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-yellow-500" /> {Object.values(attendance).filter(v => v === 'late').length} {t('att.late')}</span>
            <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> {Object.values(attendance).filter(v => v === 'absent').length} {t('att.absent')}</span>
          </div>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${saved ? 'bg-green-500' : ''}`}
            style={!saved ? { background: 'var(--btc-primary,#2563eb)' } : {}}>
            {saved ? <><CheckCircle size={16} /> {lang === 'fr' ? 'Enregistré !' : 'Saved!'}</> : <><Save size={16} /> {t('common.save')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
