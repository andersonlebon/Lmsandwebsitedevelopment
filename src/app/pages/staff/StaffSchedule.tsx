import { motion } from 'motion/react';
import { Clock, MapPin, Users, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const weekDaysFr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const schedule: Record<string, { time: string; course: string; room: string; students: number }[]> = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
};

const colors = ['#2563eb', '#16a34a', '#7c3aed'];

export function StaffSchedule() {
  const { t, lang } = useLanguage();
  const days = lang === 'fr' ? weekDaysFr : weekDays;
  const today = new Date().getDay(); // 0=Sun

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('staff.schedule')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Votre emploi du temps de la semaine' : 'Your weekly class schedule'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: lang === 'fr' ? 'Cours / Semaine' : 'Classes / Week', value: '0', icon: BookOpen, color: '#2563eb' },
          { label: lang === 'fr' ? 'Heures / Semaine' : 'Hours / Week', value: '0h', icon: Clock, color: '#16a34a' },
          { label: lang === 'fr' ? 'Total Étudiants' : 'Total Students', value: '0', icon: Users, color: '#7c3aed' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly schedule */}
      <div className="space-y-4">
        {weekDays.map((day, di) => {
          const classes = schedule[day] || [];
          const isToday = today === di + 1;
          return (
            <motion.div key={day} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.06 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden ${isToday ? 'border-blue-200 dark:border-blue-800 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className={`px-6 py-3 border-b ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {days[di]}
                    {isToday && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">{lang === 'fr' ? 'Aujourd\'hui' : 'Today'}</span>}
                  </h3>
                  <span className="text-xs text-gray-400">{classes.length} {lang === 'fr' ? 'cours' : 'classes'}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {classes.length === 0 && (
                  <div className="px-6 py-4 text-xs text-gray-400 text-center">
                    {lang === 'fr' ? 'Aucun cours' : 'No classes'}
                  </div>
                )}
                {classes.map((cls, ci) => (
                  <div key={ci} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full" style={{ background: colors[ci % colors.length] }} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{cls.course}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1"><Clock size={11} /> {cls.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {cls.room}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={12} /> {cls.students}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
