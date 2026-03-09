import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Search, Download, Eye, Plus, QrCode, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

interface CertRow {
  id: string;
  studentId: string;
  programId: string;
  promotionId: string;
  enrollmentId?: string;
  issuedAt?: string;
  certificateCode: string;
  pdfUrl?: string | null;
}

export function CertificatesAdmin() {
  const { t, lang } = useLanguage();
  const [certificates, setCertificates] = useState<CertRow[]>([]);
  const [promotions, setPromotions] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr?: string; departmentName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewCert, setPreviewCert] = useState<CertRow | null>(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({ promotionId: '', programId: '' });
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
    apiFetch('/promotions', { requireAuth: true }).then((d: any) => setPromotions(d.promotions || [])).catch(() => {});
    apiFetch('/programs', { requireAuth: true }).then((d: any) => setPrograms(d.programs || [])).catch(() => {});
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/certificates', { requireAuth: true });
      setCertificates(d.certificates || []);
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.promotionId || !generateForm.programId) return;
    setGenerateLoading(true);
    setGenerateResult(null);
    try {
      const d = await apiFetch('/certificates/generate', {
        method: 'POST',
        body: JSON.stringify({ promotionId: generateForm.promotionId, programId: generateForm.programId }),
        requireAuth: true,
      });
      setGenerateResult((d as any).generated != null ? `Generated ${(d as any).generated} certificate(s).` : 'Done.');
      loadCertificates();
      setGenerateForm({ promotionId: '', programId: '' });
    } catch (e: any) {
      setGenerateResult(e.message || 'Failed to generate');
    } finally {
      setGenerateLoading(false);
    }
  };

  const filtered = certificates.filter(c => {
    const matchSearch = !search ||
      (c.certificateCode && c.certificateCode.toLowerCase().includes(search.toLowerCase())) ||
      (c.studentId && c.studentId.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{t('common.certificatesAdmin')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{lang === 'fr' ? 'Gérez les certificats des étudiants' : 'Manage student certificates'}</p>
        </div>
        <button onClick={() => { setGenerateModal(true); setGenerateResult(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
          <Plus size={16} /> {lang === 'fr' ? 'Générer certificats' : 'Generate certificates'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: lang === 'fr' ? 'Total émis' : 'Total issued', value: certificates.length, color: '#16a34a' },
          { label: lang === 'fr' ? 'Ce mois' : 'This month', value: certificates.filter(c => c.issuedAt && c.issuedAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length, color: '#2563eb' },
          { label: lang === 'fr' ? 'Filtrage' : 'Filtered', value: filtered.length, color: '#6b7280' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700, color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search') + '...'}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Code', lang === 'fr' ? 'Étudiant (ID)' : 'Student (ID)', 'Program', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><Loader2 size={24} className="animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{lang === 'fr' ? 'Aucun certificat' : 'No certificates'}</td></tr>
              ) : (
                filtered.map((cert, i) => (
                  <motion.tr key={cert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{cert.certificateCode}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{cert.studentId?.slice(0, 8)}…</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{cert.programId?.slice(0, 8)}…</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPreviewCert(cert)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Eye size={15} /></button>
                        {cert.pdfUrl && <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"><Download size={15} /></a>}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
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
                <h3 className="text-xl text-gray-900 dark:text-white font-mono" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Student {previewCert.studentId?.slice(0, 8)}…</h3>
                <p className="text-gray-400 text-sm">{lang === 'fr' ? 'a réussi le programme' : 'has successfully completed the program'}</p>
                <p className="text-xs text-gray-400">{previewCert.issuedAt ? new Date(previewCert.issuedAt).toLocaleDateString() : ''}</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <QrCode size={14} className="text-gray-400" />
                  <span className="text-xs font-mono text-gray-400">{previewCert.certificateCode}</span>
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

      {/* Generate certificates modal */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setGenerateModal(false); setGenerateResult(null); }}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>{lang === 'fr' ? 'Générer certificats' : 'Generate certificates'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{lang === 'fr' ? 'Choisissez une promotion et un programme. Les certificats seront créés pour tous les étudiants actifs non encore certifiés.' : 'Select a promotion and program. Certificates will be created for all active enrollments not already certified.'}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Promotion' : 'Promotion'}</label>
                <select value={generateForm.promotionId} onChange={e => setGenerateForm(f => ({ ...f, promotionId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">—</option>
                  {promotions.map(p => <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Programme' : 'Program'}</label>
                <select value={generateForm.programId} onChange={e => setGenerateForm(f => ({ ...f, programId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">—</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>)}
                </select>
              </div>
              {generateResult && <p className={`text-sm ${generateResult.startsWith('Generated') || generateResult === 'Done.' ? 'text-green-600' : 'text-red-500'}`}>{generateResult}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setGenerateModal(false); setGenerateResult(null); }} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{t('common.cancel')}</button>
              <button onClick={handleGenerate} disabled={generateLoading || !generateForm.promotionId || !generateForm.programId}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {generateLoading && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Générer' : 'Generate'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}