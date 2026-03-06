import { motion } from 'motion/react';
import { Award, Download, Share2, ExternalLink, Calendar, CheckCircle, Clock, Lock } from 'lucide-react';

const earnedCerts: any[] = [];

const inProgressCerts: any[] = [];

export function PortalCertificates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Certificates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your earned and in-progress certifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Earned', value: earnedCerts.length, icon: Award, color: '#16a34a' },
          { label: 'In Progress', value: inProgressCerts.length, icon: Clock, color: '#2563eb' },
          { label: 'Total Available', value: '0', icon: CheckCircle, color: '#7c3aed' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <s.icon size={22} className="mx-auto mb-2" style={{ color: s.color }} />
            <div className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Earned Certificates */}
      <div>
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Earned Certificates</h3>
        {earnedCerts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Award size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No certificates earned yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {earnedCerts.map((cert: any, i: number) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                <div className="p-6 text-center relative" style={{ background: `linear-gradient(135deg, ${cert.color}10, ${cert.color}05)` }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${cert.color}20` }}>
                    <Award size={28} style={{ color: cert.color }} />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2" style={{ background: cert.color }}>
                    Grade: {cert.grade} ({cert.score}%)
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{cert.title}</h4>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-center">
                    {cert.verifyId}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* In Progress */}
      <div>
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>In Progress</h3>
        {inProgressCerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Lock size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No courses in progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressCerts.map((cert: any, i: number) => (
              <motion.div key={cert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cert.color}20` }}>
                  <Lock size={18} style={{ color: cert.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cert.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cert.remaining} remaining</p>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${cert.progress}%`, background: cert.color }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
