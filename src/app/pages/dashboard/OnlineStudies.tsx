import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Search, Edit2, Trash2, Eye, X, Users, Clock, Play, FileText, Video, Link2, Star } from 'lucide-react';

const INITIAL_COURSES: Course[] = [];

type Course = { id: string; title: string; category: string; instructor: string; students: number; duration: string; modules: number; status: string; price: number; level: string; rating: number; progress: number };
const CAT_COLORS: Record<string, string> = { language: '#16a34a', trade: '#2563eb', professional: '#7c3aed' };
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', archived: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };

const BLANK: Omit<Course, 'id'> = { title: '', category: 'language', instructor: '', students: 0, duration: '', modules: 0, status: 'draft', price: 0, level: 'Beginner', rating: 5.0, progress: 0 };

export function OnlineStudies() {
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, 'id'>>(BLANK);
  const [activeTab, setActiveTab] = useState<'courses' | 'content'>('courses');

  const filtered = courses.filter(c => {
    const matchCat = catFilter === 'all' || c.category === catFilter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = () => {
    if (modal === 'add') {
      const id = `C-${String(courses.length + 1).padStart(3, '0')}`;
      setCourses(cs => [...cs, { id, ...form }]);
    } else if (modal === 'edit' && selected) {
      setCourses(cs => cs.map(c => c.id === selected.id ? { id: c.id, ...form } : c));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => { if (confirm('Delete this course?')) setCourses(cs => cs.filter(c => c.id !== id)); };

  const contentModules: any[] = [];

  const typeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-blue-500" />;
      case 'document': return <FileText size={14} className="text-green-500" />;
      case 'quiz': return <Star size={14} className="text-yellow-500" />;
      default: return <Link2 size={14} className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Online Studies</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{courses.length} courses, {courses.reduce((a, c) => a + c.students, 0)} students enrolled</p>
        </div>
        <button onClick={() => { setForm(BLANK); setModal('add'); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {(['courses', 'content'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab === 'courses' ? '📚 Courses' : '🗂️ Content Manager'}
          </button>
        ))}
      </div>

      {activeTab === 'courses' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Courses', value: courses.filter(c => c.status === 'active').length, color: '#16a34a' },
              { label: 'Draft Courses', value: courses.filter(c => c.status === 'draft').length, color: '#eab308' },
              { label: 'Total Students', value: courses.reduce((a, c) => a + c.students, 0), color: '#2563eb' },
              { label: 'Total Modules', value: courses.reduce((a, c) => a + c.modules, 0), color: '#7c3aed' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins', color: s.color }}>{s.value}</div>
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
                placeholder="Search courses..." />
            </div>
            <div className="flex gap-1">
              {['all', 'language', 'trade', 'professional'].map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors whitespace-nowrap ${catFilter === c ? 'text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                  style={catFilter === c ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${CAT_COLORS[c.category]}20` }}>
                      <BookOpen size={20} style={{ color: CAT_COLORS[c.category] }} />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1" style={{ fontFamily: 'Poppins' }}>{c.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Instructor: {c.instructor}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Users size={11} /> {c.students}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {c.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {c.modules} modules</span>
                  </div>
                  {c.status === 'active' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span><span>{c.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${c.progress}%`, background: CAT_COLORS[c.category] }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: CAT_COLORS[c.category], fontFamily: 'Poppins' }}>${c.price}/mo</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(c); setModal('view'); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><Eye size={14} /></button>
                      <button onClick={() => { setSelected(c); setForm({ title: c.title, category: c.category, instructor: c.instructor, students: c.students, duration: c.duration, modules: c.modules, status: c.status, price: c.price, level: c.level, rating: c.rating, progress: c.progress }); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Content Manager */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Content Manager</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">English Language — Beginner (C-001)</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
              <Plus size={14} /> Add Module
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {contentModules.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                  {m.id}
                </div>
                <div className="flex items-center gap-2">
                  {typeIcon(m.type)}
                  <span className="text-sm text-gray-800 dark:text-gray-200">{m.title}</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={11} /> {m.duration}</span>
                  <span className={`px-2 py-0.5 rounded-full ${m.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {m.status}
                  </span>
                  <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><Edit2 size={13} /></button>
                  <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><Play size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>
                  {modal === 'add' ? 'New Course' : modal === 'edit' ? 'Edit Course' : 'Course Details'}
                </h3>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={18} className="text-gray-500" /></button>
              </div>
              <div className="p-5">
                {modal === 'view' && selected ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{selected.title}</h4>
                    {[['ID', selected.id], ['Category', selected.category], ['Instructor', selected.instructor], ['Duration', selected.duration], ['Modules', selected.modules], ['Students', selected.students], ['Price', `$${selected.price}/month`], ['Level', selected.level], ['Rating', selected.rating]].map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                        <span className="text-gray-500">{k}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Course Title</label>
                      <input value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="Course title" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Category', key: 'category', opts: ['language', 'trade', 'professional'] },
                        { label: 'Level', key: 'level', opts: ['Beginner', 'Intermediate', 'Advanced'] },
                        { label: 'Status', key: 'status', opts: ['active', 'draft', 'archived'] },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                          <select value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500">
                            {f.opts.map(o => <option key={o} className="capitalize">{o}</option>)}
                          </select>
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Price ($/month)</label>
                        <input type="number" value={form.price} onChange={e => setForm(v => ({ ...v, price: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Instructor</label>
                      <input value={form.instructor} onChange={e => setForm(v => ({ ...v, instructor: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500"
                        placeholder="Instructor name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Duration</label>
                        <input value={form.duration} onChange={e => setForm(v => ({ ...v, duration: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500"
                          placeholder="6 months" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Modules</label>
                        <input type="number" value={form.modules} onChange={e => setForm(v => ({ ...v, modules: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-white font-medium hover:opacity-90" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        {modal === 'add' ? 'Create Course' : 'Save Changes'}
                      </button>
                      <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}