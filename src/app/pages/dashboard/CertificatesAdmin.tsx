import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Search, Download, Eye, Plus, QrCode, CheckCircle, Clock, X, User } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const certificates: any[] = [];

export function CertificatesAdmin() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewCert, setPreviewCert] = useState<typeof certificates[0] | null>(null);

  const filtered = certificates.filter(c => {
    const matchSearch = !search || c.student.toLowerCase().includes(search.toLowerCase()) || c.course.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('common.certificatesAdmin')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Gérez les certificats des étudiants' : 'Manage student certificates'}</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
          <Plus size={16} /> {lang === 'fr' ? 'Émettre Certificat' : 'Issue Certificate'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Émis' : 'Total Issued', value: certificates.filter(c => c.status === 'issued').length, color: '#16a34a' },
          { label: lang === 'fr' ? 'En Attente' : 'Pending', value: certificates.filter(c => c.status === 'pending').length, color: '#f59e0b' },
          { label: lang === 'fr' ? 'Ce Mois' : 'This Month', value: 2, color: '#2563eb' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700, color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search') + '...'}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="flex gap-1">
          {['all', 'issued', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filter === f ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'}`}
              style={filter === f ? { background: 'var(--btc-primary,#2E8B57)' } : {}}>
              {f === 'all' ? (lang === 'fr' ? 'Tous' : 'All') : f === 'issued' ? (lang === 'fr' ? 'Émis' : 'Issued') : (lang === 'fr' ? 'En Attente' : 'Pending')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['ID', lang === 'fr' ? 'Étudiant' : 'Student', lang === 'fr' ? 'Cours' : 'Course', 'Date', t('common.status'), 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((cert, i) => (
                <motion.tr key={cert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{cert.id}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--btc-primary,#2E8B57)' }}>{cert.student.charAt(0)}</div>
                      <span className="font-medium text-gray-900 dark:text-white">{cert.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{cert.course}</td>
                  <td className="px-6 py-3 text-gray-500">{cert.date}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${cert.status === 'issued' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'}`}>
                      {cert.status === 'issued' ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {cert.status === 'issued' ? (lang === 'fr' ? 'Émis' : 'Issued') : (lang === 'fr' ? 'En Attente' : 'Pending')}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewCert(cert)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Eye size={15} /></button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"><Download size={15} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      <AnimatePresence>
        {previewCert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewCert(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="p-8 text-center" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#2E8B57) 0%, var(--btc-primary-dark,#00ACC1) 100%)' }}>
                <Award size={48} className="text-white/80 mx-auto mb-3" />
                <h2 className="text-white text-xl" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Certificate of Completion</h2>
                <p className="text-white/70 text-sm">Brotherly Training Center — Goma, DRC</p>
              </div>
              <div className="p-8 text-center space-y-4">
                <p className="text-gray-400 text-sm">{lang === 'fr' ? 'Ceci certifie que' : 'This certifies that'}</p>
                <h3 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{previewCert.student}</h3>
                <p className="text-gray-400 text-sm">{lang === 'fr' ? 'a réussi le cours' : 'has successfully completed'}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--btc-primary,#2E8B57)' }}>{previewCert.course}</p>
                <p className="text-xs text-gray-400">{previewCert.date}</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <QrCode size={14} className="text-gray-400" />
                  <span className="text-xs font-mono text-gray-400">{previewCert.qr}</span>
                </div>
              </div>
              <div className="px-8 pb-6 flex gap-3">
                <button className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
                  <Download size={14} /> {lang === 'fr' ? 'Télécharger' : 'Download'}
                </button>
                <button onClick={() => setPreviewCert(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500">{t('common.close')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}