import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { BookOpen, Play, Clock, Award, Users, Star, FileText, Video, CheckCircle, Lock } from 'lucide-react';

const myCourses: any[] = [];

const typeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video size={14} className="text-blue-500" />;
    case 'document': return <FileText size={14} className="text-green-500" />;
    case 'quiz': return <Star size={14} className="text-yellow-500" />;
    default: return <BookOpen size={14} />;
  }
};

export function PortalMyCourses() {
  const [activeCourse, setActiveCourse] = useState(0);
  const course = myCourses.find(c => c.id === activeCourse);

  if (myCourses.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">0 enrolled courses</p>
        </div>
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No courses enrolled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>My Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{myCourses.length} enrolled courses</p>
      </div>

      {/* Course Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {myCourses.map(c => (
          <button key={c.id} onClick={() => setActiveCourse(c.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCourse === c.id ? 'text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            style={activeCourse === c.id ? { background: c.color } : {}}>
            <BookOpen size={15} />
            {c.title}
          </button>
        ))}
      </div>

      {/* Course Detail */}
      <motion.div key={activeCourse} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${course.color}20` }}>
              <BookOpen size={28} style={{ color: course.color }} />
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{course.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Instructor: {course.instructor}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                <span className="flex items-center gap-1"><BookOpen size={12} /> {course.modules} modules</span>
                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {course.rating}</span>
                <span className="flex items-center gap-1"><CheckCircle size={12} style={{ color: course.color }} /> {course.completed}/{course.modules} complete</span>
              </div>
              <Link
                to={`/portal/courses/${course.id}`}
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-white text-xs font-medium hover:opacity-90 transition-all"
                style={{ background: course.color }}
              >
                <Play size={13} /> Open Course Player
              </Link>
            </div>
            <div className="text-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={course.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - course.progress / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: course.color, fontFamily: 'Poppins' }}>{course.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Course Curriculum</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {course.lessons.map((lesson, i) => (
              <motion.div key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${lesson.done ? 'hover:bg-gray-50 dark:hover:bg-gray-700/30' : 'opacity-80'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  lesson.done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {lesson.done ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> : <Lock size={14} className="text-gray-400" />}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {typeIcon(lesson.type)}
                  <span className={`text-sm ${lesson.done ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{lesson.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  <span className="flex items-center gap-1"><Clock size={11} /> {lesson.duration}</span>
                  {lesson.done ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                  ) : (
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90" style={{ background: course.color }}>
                      <Play size={11} /> Start
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}