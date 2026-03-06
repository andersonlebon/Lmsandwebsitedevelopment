import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, FileText, Download, Trash2, Plus, Upload, X, BookOpen, Calendar, Eye } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const materials: any[] = [];

export function StaffMaterials() {
  const { t, lang } = useLanguage();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('staff.materials')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Gérez et partagez vos supports de cours' : 'Manage and share your course materials'}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'var(--btc-primary,#2563eb)' }}>
          <Plus size={16} /> {t('staff.uploadMaterial')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: lang === 'fr' ? 'Total Fichiers' : 'Total Files', value: materials.length, icon: FileText, color: '#2563eb' },
          { label: lang === 'fr' ? 'Téléchargements' : 'Downloads', value: materials.reduce((a: number, m: any) => a + m.downloads, 0), icon: Download, color: '#16a34a' },
          { label: lang === 'fr' ? 'Cours Couverts' : 'Courses Covered', value: 0, icon: BookOpen, color: '#7c3aed' },
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

      {/* Materials List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{lang === 'fr' ? 'Tous les Matériels' : 'All Materials'}</h3>
        </div>
        {materials.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <FileUp size={32} className="mx-auto mb-2 opacity-40" />
            <p>{lang === 'fr' ? 'Aucun matériel téléversé.' : 'No materials uploaded yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {materials.map((mat: any, i: number) => (
              <motion.div key={mat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <FileText size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{mat.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{mat.course}</span>
                      <span>{mat.type} · {mat.size}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {mat.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Download size={11} /> {mat.downloads}</span>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Eye size={15} /></button>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={15} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('staff.uploadMaterial')}</h3>
                <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input placeholder={lang === 'fr' ? 'Titre du document' : 'Document title'} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none">
                  <option>English Level 2 — Group A</option>
                  <option>English Level 1 — Group B</option>
                  <option>English TOT</option>
                </select>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
                  <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">{lang === 'fr' ? 'Glissez un fichier ici ou' : 'Drag a file here or'}</p>
                  <button className="text-sm font-medium mt-1" style={{ color: 'var(--btc-primary,#2563eb)' }}>{lang === 'fr' ? 'parcourir' : 'browse'}</button>
                </div>
                <button className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2" style={{ background: 'var(--btc-primary,#2563eb)' }}>
                  <FileUp size={16} /> {lang === 'fr' ? 'Téléverser' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
