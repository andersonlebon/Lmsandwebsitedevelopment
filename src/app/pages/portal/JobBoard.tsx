import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, Clock, DollarSign, Search, Filter, ExternalLink, Building2, Users, Star } from 'lucide-react';

const jobs: any[] = [];

const TYPE_COLORS: Record<string, string> = {
  'Full-time': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Part-time': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Contract': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Internship': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function PortalJobBoard() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<typeof jobs[0] | null>(null);

  const filtered = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || j.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Job Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Career opportunities for BTC students and graduates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Positions', value: jobs.length, icon: Briefcase, color: '#16a34a' },
          { label: 'Companies', value: new Set(jobs.map(j => j.company)).size, icon: Building2, color: '#2563eb' },
          { label: 'Urgent Hiring', value: jobs.filter(j => j.urgent).length, icon: Star, color: '#ea580c' },
          { label: 'BTC Graduates Hired', value: '95%', icon: Users, color: '#7c3aed' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <s.icon size={18} className="mb-2" style={{ color: s.color }} />
            <div className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
            placeholder="Search jobs or companies..." />
        </div>
        <div className="flex gap-1">
          {['all', 'Full-time', 'Part-time', 'Contract', 'Internship'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
                typeFilter === t ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              style={typeFilter === t ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((job, i) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            onClick={() => setSelectedJob(job)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Building2 size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>{job.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                </div>
              </div>
              {job.urgent && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">Urgent</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{job.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.skills.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={11} /> {job.salary}</span>
              </div>
              <span className={`px-2 py-1 rounded-full font-medium ${TYPE_COLORS[job.type]}`}>{job.type}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedJob(null)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Building2 size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{selectedJob.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedJob.company}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{selectedJob.desc}</p>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Location</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.location}</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Salary</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.salary}</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Type</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.type}</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-xs text-gray-500 mb-1">Posted</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedJob.posted}</div></div>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map(s => (
                      <span key={s} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--btc-primary,#16a34a)' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    <ExternalLink size={16} /> Apply Now
                  </button>
                  <button onClick={() => setSelectedJob(null)} className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}