import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { BookOpen, Clock, Users, Award, ArrowRight, Search, Filter, Star, Languages, Monitor, Calculator, Palette, Briefcase, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const langImg = 'https://images.unsplash.com/photo-1581019055756-93b5361f9536?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600';
const onlineImg = 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600';
const trainingImg = 'https://images.unsplash.com/photo-1740205642946-72e75a92124b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600';

const courses = [
  { id: 1, category: 'language', title: 'English Language', icon: Languages, color: '#16a34a', img: langImg, level: 'All Levels', duration: '3–12 months', students: 180, price: 50, rating: 4.9, description: 'Comprehensive English training: speaking, writing, grammar, and business communication. IELTS and TOEFL preparation included.' },
  { id: 2, category: 'language', title: 'French Language', icon: Globe, color: '#2563eb', img: langImg, level: 'All Levels', duration: '3–12 months', students: 145, price: 45, rating: 4.8, description: 'Professional French for communication, DELF/DALF exam preparation, and business French for the workplace.' },
  { id: 3, category: 'language', title: 'Swahili Language', icon: Languages, color: '#7c3aed', img: langImg, level: 'All Levels', duration: '2–6 months', students: 95, price: 35, rating: 4.7, description: 'Master Swahili — the lingua franca of East & Central Africa — for professional and personal communication.' },
  { id: 4, category: 'language', title: 'Arabic Language', icon: Languages, color: '#d97706', img: langImg, level: 'Beginner', duration: '6–12 months', students: 60, price: 55, rating: 4.6, description: 'Modern Standard Arabic with focus on reading, writing, and conversation for professional contexts.' },
  { id: 5, category: 'trade', title: 'Computer Science & IT', icon: Monitor, color: '#0891b2', img: onlineImg, level: 'Beginner to Pro', duration: '6–12 months', students: 120, price: 60, rating: 4.9, description: 'Web development, programming basics (Python, HTML/CSS), Microsoft Office, and digital literacy skills.' },
  { id: 6, category: 'trade', title: 'Accounting & Finance', icon: Calculator, color: '#ea580c', img: trainingImg, level: 'Intermediate', duration: '6 months', students: 75, price: 55, rating: 4.7, description: 'Financial accounting, bookkeeping, QuickBooks, budget management, and Congolese business law.' },
  { id: 7, category: 'trade', title: 'Graphic Design', icon: Palette, color: '#d946ef', img: onlineImg, level: 'All Levels', duration: '3–6 months', students: 65, price: 50, rating: 4.8, description: 'Adobe Photoshop, Illustrator, InDesign — logo design, branding, social media graphics, and print design.' },
  { id: 8, category: 'professional', title: 'Business Management', icon: Briefcase, color: '#64748b', img: trainingImg, level: 'Advanced', duration: '12 months', students: 48, price: 70, rating: 4.8, description: 'Entrepreneurship, project management, leadership, marketing strategies for African markets.' },
  { id: 9, category: 'professional', title: 'Chinese (Mandarin)', icon: Languages, color: '#dc2626', img: langImg, level: 'Beginner', duration: '12 months', students: 35, price: 65, rating: 4.7, description: 'Basic Mandarin for business and daily communication, HSK preparation, and cultural awareness.' },
];

const categories = [
  { key: 'all', label: 'All Courses' },
  { key: 'language', label: 'Languages' },
  { key: 'trade', label: 'Trades & IT' },
  { key: 'professional', label: 'Professional' },
];

export function Courses() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const { t } = useLanguage();

  const filtered = courses.filter(c => {
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="pt-20 bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a) 0%, var(--btc-primary-dark,#15803d) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800 }}>
              {t('courses.title')}
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              {t('courses.subtitle')}
            </p>
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('courses.search')}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={activeCategory === cat.key ? { background: 'var(--btc-primary,#16a34a)' } : {}}
            >
              {cat.label}
            </button>
          ))}
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter size={14} /> {filtered.length} courses
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={course.img} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-medium text-white px-2 py-1 rounded-full capitalize" style={{ background: course.color }}>
                        {course.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                      <course.icon size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{course.title}</h3>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{course.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {course.students} students</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: course.color, fontFamily: 'Poppins' }}>${course.price}/month</span>
                      <span className="text-xs px-2 py-1 rounded-full border" style={{ color: course.color, borderColor: course.color + '40', background: course.color + '10' }}>
                        {course.level}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
              <p>No courses found. Try a different search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Course Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCourse(null)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <img src={selectedCourse.img} alt={selectedCourse.title} className="w-full h-52 object-cover" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{selectedCourse.title}</h2>
                  <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedCourse.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{selectedCourse.description}</p>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-gray-500 text-xs mb-1">Duration</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedCourse.duration}</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-gray-500 text-xs mb-1">Level</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedCourse.level}</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-gray-500 text-xs mb-1">Students</div><div className="text-gray-800 dark:text-gray-200 font-medium">{selectedCourse.students}+</div></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-gray-500 text-xs mb-1">Price</div><div className="font-bold" style={{ color: selectedCourse.color }}>${selectedCourse.price}/month</div></div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/courses/${selectedCourse.id}`} className="flex-1 py-3 rounded-xl text-white text-center font-semibold hover:opacity-90 transition-all" style={{ background: selectedCourse.color }}>
                    View Full Details
                  </Link>
                  <button onClick={() => setSelectedCourse(null)} className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Not sure which course is right for you?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Talk to our academic advisors. We'll help you find the perfect program.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            Contact an Advisor <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}