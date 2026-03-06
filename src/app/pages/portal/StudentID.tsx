import { motion } from 'motion/react';
import { QrCode, Download, Calendar, Clock, User, BookOpen, MapPin, Shield } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import btcLogo from 'figma:asset/a830ae5c9e57e0e708aaa9224b0dd9363e9028d9.png';

function QRCodePlaceholder({ value }: { value: string }) {
  // Generate a visual QR-code-like pattern from the string
  const hash = value.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const bits = Array.from({ length: 121 }, (_, i) => ((hash * (i + 1) * 7919) >>> 0) % 3 !== 0);
  return (
    <div className="w-28 h-28 bg-white p-2 rounded-xl">
      <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-px">
        {bits.map((filled, i) => (
          <div key={i} className={`rounded-[1px] ${filled ? 'bg-gray-900' : 'bg-white'}`} />
        ))}
      </div>
    </div>
  );
}

export function PortalStudentID() {
  const { t, lang } = useLanguage();

  const user = JSON.parse(localStorage.getItem('btc_user') || '{"name":"—","email":""}');

  const student = {
    name: user.name || '—',
    id: '—',
    department: '—',
    course: '—',
    enrolled: '—',
    validUntil: '—',
    instructor: '—',
    schedule: '—',
    photo: null,
  };

  const weekSchedule: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('sid.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('sid.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ID Card — Front */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#2E8B57) 0%, var(--btc-primary-dark,#00ACC1) 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={btcLogo} alt="BTC" className="w-10 h-10 rounded-xl object-contain bg-white/90 p-0.5" />
                <div>
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Poppins' }}>Brotherly Training Center</p>
                  <p className="text-white/70 text-xs">Goma, Nord-Kivu, DRC</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <p className="text-white text-xs font-bold">2025–2026</p>
              </div>
            </div>

            {/* Student info */}
            <div className="flex items-start gap-5">
              <div className="w-20 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                <User size={32} className="text-white/60" />
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{student.name}</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Shield size={13} /> <span className="font-mono font-bold">{student.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <BookOpen size={13} /> {student.department} — {student.course}
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Clock size={13} /> {student.schedule}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-white/60 text-xs">{t('sid.enrolled')}: {student.enrolled}</p>
                <p className="text-white/60 text-xs">{t('sid.validUntil')}: {student.validUntil}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg">
                <p className="text-green-300 text-xs font-bold flex items-center gap-1"><Shield size={10} /> VALID</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QR Code Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center shadow-lg">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('sid.scanQR')}</p>
          <QRCodePlaceholder value={student.id} />
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-white mt-3">{student.id}</p>
          <p className="text-xs text-gray-400 mt-1">{student.name}</p>
          <button className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
            <Download size={15} /> {t('sid.download')}
          </button>
        </motion.div>
      </div>

      {/* Weekly Schedule */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--btc-primary,#2E8B57)' }} />
          <h3 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('sid.schedule')}</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {weekSchedule.map((day, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-24">{day.day}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={13} /> {day.time}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-300">{day.course}</span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1"><MapPin size={11} />{day.room}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Instructor */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--btc-primary,#2E8B57)' }}>MC</div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.instructor}</p>
          <p className="text-xs text-gray-400">{t('sid.instructor')} — {student.department}</p>
        </div>
      </motion.div>
    </div>
  );
}