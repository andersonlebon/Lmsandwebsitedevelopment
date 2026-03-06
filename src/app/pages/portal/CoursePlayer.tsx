import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, BookOpen, Play, Pause, CheckCircle, Lock, Clock, Video,
  FileText, Star, ChevronDown, ChevronUp, Download, Bookmark, BookmarkCheck,
  MessageSquare, StickyNote, ChevronLeft, ChevronRight, Volume2, Maximize2,
  SkipBack, SkipForward, Settings, X
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  type: string;
  duration: string;
  done: boolean;
  content?: string;
}

interface Module {
  title: string;
  lessons: Lesson[];
}

interface CoursePlayerData {
  id: number;
  title: string;
  instructor: string;
  color: string;
  progress: number;
  modules: Module[];
}

const coursesData: Record<string, CoursePlayerData> = {};

function getCoursePlayer(id: string): CoursePlayerData | null {
  return coursesData[id] || null;
}

const typeIcon = (type: string, size = 14) => {
  switch (type) {
    case 'video': return <Video size={size} className="text-blue-500" />;
    case 'document': return <FileText size={size} className="text-green-500" />;
    case 'quiz': return <Star size={size} className="text-yellow-500" />;
    default: return <BookOpen size={size} />;
  }
};

export function PortalCoursePlayer() {
  const { id } = useParams();
  const course = getCoursePlayer(id || '1');

  if (!course) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] -m-4 lg:-m-6 bg-gray-50 dark:bg-gray-950">
        <div className="text-center text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Course not found.</p>
          <Link to="/portal/courses" className="text-xs mt-2 inline-block" style={{ color: 'var(--btc-primary,#16a34a)' }}>
            ← Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  const allLessons = course.modules.flatMap(m => m.lessons);
  const firstUndone = allLessons.find(l => !l.done)?.id || allLessons[0].id;

  const [activeLessonId, setActiveLessonId] = useState(firstUndone);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set(allLessons.filter(l => l.done).map(l => l.id))
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0, 1, 2]));

  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];
  const activeIndex = allLessons.findIndex(l => l.id === activeLessonId);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  const completedCount = completedLessons.size;
  const totalLessons = allLessons.length;
  const progressPct = Math.round((completedCount / totalLessons) * 100);

  const toggleModuleExpand = (idx: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const markComplete = () => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      next.add(activeLessonId);
      return next;
    });
    if (nextLesson) setActiveLessonId(nextLesson.id);
  };

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Course Modules */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
          >
            {/* Course Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <Link to="/portal/courses" className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <ArrowLeft size={14} /> Back to Courses
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Poppins' }}>{course.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{course.instructor}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{completedCount}/{totalLessons} complete</span>
                  <span className="font-bold" style={{ color: course.color }}>{progressPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: course.color }}
                  />
                </div>
              </div>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto">
              {course.modules.map((module, mi) => (
                <div key={mi}>
                  <button
                    onClick={() => toggleModuleExpand(mi)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-xs font-bold text-gray-400">M{mi + 1}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{module.title}</span>
                    </div>
                    {expandedModules.has(mi) ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  {expandedModules.has(mi) && (
                    <div>
                      {module.lessons.map(lesson => {
                        const isActive = lesson.id === activeLessonId;
                        const isDone = completedLessons.has(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-3 ${
                              isActive
                                ? 'bg-green-50 dark:bg-green-900/10 border-l-[3px]'
                                : 'border-l-[3px] border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                            style={isActive ? { borderLeftColor: course.color } : {}}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isDone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              {isDone ? (
                                <CheckCircle size={13} className="text-green-600 dark:text-green-400" />
                              ) : isActive ? (
                                <Play size={10} style={{ color: course.color }} className="ml-0.5" />
                              ) : (
                                <span className="text-xs text-gray-400">{lesson.id}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs truncate ${isActive ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                {typeIcon(lesson.type, 10)}
                                <span>{lesson.duration}</span>
                              </div>
                            </div>
                            {bookmarked.has(lesson.id) && (
                              <BookmarkCheck size={12} className="text-yellow-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video/Content Player */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative bg-gray-900 aspect-video max-h-[60vh]">
            {activeLesson.type === 'video' ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all mb-4 mx-auto"
                    >
                      {isPlaying ? (
                        <Pause size={32} className="text-white" />
                      ) : (
                        <Play size={32} className="text-white ml-1" />
                      )}
                    </motion.button>
                    <p className="text-white/80 text-sm">{activeLesson.title}</p>
                    <p className="text-white/50 text-xs mt-1">{activeLesson.duration}</p>
                  </div>
                </div>
                {/* Video Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="h-1 bg-white/20 rounded-full mb-3 cursor-pointer group">
                    <div className="h-full rounded-full transition-all group-hover:h-1.5" style={{ width: '35%', background: course.color }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-white/80 hover:text-white transition-colors">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors"><SkipBack size={16} /></button>
                      <button className="text-white/60 hover:text-white transition-colors"><SkipForward size={16} /></button>
                      <span className="text-white/60 text-xs">15:42 / {activeLesson.duration}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-white/60 hover:text-white transition-colors"><Volume2 size={16} /></button>
                      <button className="text-white/60 hover:text-white transition-colors"><Settings size={16} /></button>
                      <button className="text-white/60 hover:text-white transition-colors"><Maximize2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </>
            ) : activeLesson.type === 'document' ? (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center">
                <div className="max-w-2xl p-8 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-green-500 opacity-60" />
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>{activeLesson.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{activeLesson.duration} reading time</p>
                  {activeLesson.content && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed text-left">{activeLesson.content}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center p-8">
                  <Star size={48} className="mx-auto mb-4 text-yellow-500 opacity-60" />
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>{activeLesson.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{activeLesson.duration}</p>
                  <button className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all" style={{ background: course.color }}>
                    Start Quiz
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info Bar */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
                    <BookOpen size={16} />
                  </button>
                )}
                <div>
                  <h2 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{activeLesson.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {typeIcon(activeLesson.type, 12)}
                    <span>{activeLesson.duration}</span>
                    <span>Lesson {activeIndex + 1} of {totalLessons}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(activeLessonId)}
                  className={`p-2 rounded-xl transition-colors ${bookmarked.has(activeLessonId) ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title="Bookmark"
                >
                  {bookmarked.has(activeLessonId) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`p-2 rounded-xl transition-colors ${showNotes ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title="Notes"
                >
                  <StickyNote size={18} />
                </button>
                <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Download">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Notes Panel */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 overflow-hidden"
              >
                <div className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <StickyNote size={12} /> Your Notes
                    </p>
                    <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Take notes for this lesson..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lesson Content */}
          {activeLesson.content && activeLesson.type !== 'document' && (
            <div className="px-4 lg:px-6 py-6">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Lesson Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{activeLesson.content}</p>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
            disabled={!prevLesson}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="flex items-center gap-3">
            {!completedLessons.has(activeLessonId) && (
              <button
                onClick={markComplete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
                style={{ background: course.color }}
              >
                <CheckCircle size={16} /> Mark Complete & Continue
              </button>
            )}
            {completedLessons.has(activeLessonId) && nextLesson && (
              <button
                onClick={() => setActiveLessonId(nextLesson.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
                style={{ background: course.color }}
              >
                Next Lesson <ChevronRight size={16} />
              </button>
            )}
            {completedLessons.has(activeLessonId) && !nextLesson && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
                <CheckCircle size={16} /> Course Completed!
              </div>
            )}
          </div>

          <button
            onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
            disabled={!nextLesson}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}