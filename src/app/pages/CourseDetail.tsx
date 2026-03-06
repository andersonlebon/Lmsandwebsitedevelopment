import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import {
  BookOpen, Clock, Users, Award, Star, ArrowRight, Play, CheckCircle,
  Globe, Languages, Monitor, Calculator, Palette, Briefcase, MapPin,
  Video, FileText, Download, ChevronDown, ChevronUp, Heart, Share2, ArrowLeft
} from 'lucide-react';

const instructorImg = 'https://images.unsplash.com/photo-1597570889212-97f48e632dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN0cnVjdG9yJTIwdGVhY2hpbmclMjB3aGl0ZWJvYXJkJTIwbGVjdHVyZXxlbnwxfHx8fDE3NzI3MzgyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080';
const studentImg = 'https://images.unsplash.com/photo-1758612215020-842383aadb9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBsYXB0b3AlMjBvbmxpbmUlMjBsZWFybmluZ3xlbnwxfHx8fDE3NzI3MzgyNTl8MA&ixlib=rb-4.1.0&q=80&w=1080';
const classroomImg = 'https://images.unsplash.com/photo-1770843093640-c44ae557928b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwY2xhc3Nyb29tJTIwZWR1Y2F0aW9uJTIwQWZyaWNhfGVufDF8fHx8MTc3MjczODI1OXww&ixlib=rb-4.1.0&q=80&w=1080';

interface CourseData {
  id: number;
  title: string;
  icon: any;
  color: string;
  img: string;
  level: string;
  duration: string;
  students: number;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  instructor: { name: string; title: string; bio: string; img: string; courses: number; students: number };
  whatYouLearn: string[];
  requirements: string[];
  curriculum: { title: string; lessons: { title: string; type: string; duration: string; preview?: boolean }[] }[];
  reviewsList: { name: string; rating: number; date: string; text: string }[];
}

const allCourses: Record<string, CourseData> = {
  '1': {
    id: 1, title: 'English Language', icon: Languages, color: '#16a34a', img: classroomImg,
    level: 'All Levels', duration: '3-12 months', students: 180, price: 50, rating: 4.9, reviews: 87,
    description: 'Comprehensive English training covering speaking, writing, grammar, and business communication. Includes IELTS and TOEFL preparation, professional communication, and academic English modules. Perfect for students looking to advance their career with strong English skills.',
    instructor: { name: 'Prof. Marie-Claire Nzigire', title: 'Head of Language Department', bio: 'Expert in English and French linguistics with 15+ years of teaching experience. DELF certification authority and Cambridge English examiner. Has trained over 500 students at BTC.', img: instructorImg, courses: 5, students: 320 },
    whatYouLearn: ['Master English grammar from beginner to advanced', 'Professional business communication & email writing', 'IELTS/TOEFL exam preparation strategies', 'Academic essay writing and research skills', 'Conversational English & public speaking', 'Interview preparation in English'],
    requirements: ['No prior English knowledge required for beginner track', 'Basic reading ability in any language', 'Commitment to daily practice (30 min minimum)'],
    curriculum: [
      { title: 'Module 1: Foundations', lessons: [
        { title: 'Introduction to English Grammar', type: 'video', duration: '45 min', preview: true },
        { title: 'Basic Vocabulary Building', type: 'document', duration: '30 min' },
        { title: 'Pronunciation Essentials', type: 'video', duration: '40 min', preview: true },
        { title: 'Quiz: Grammar Basics', type: 'quiz', duration: '15 min' },
      ]},
      { title: 'Module 2: Communication Skills', lessons: [
        { title: 'Everyday Conversations', type: 'video', duration: '50 min' },
        { title: 'Listening Comprehension', type: 'video', duration: '60 min' },
        { title: 'Reading & Comprehension', type: 'document', duration: '35 min' },
        { title: 'Writing Paragraphs', type: 'document', duration: '40 min' },
        { title: 'Mid-term Assessment', type: 'quiz', duration: '30 min' },
      ]},
      { title: 'Module 3: Business English', lessons: [
        { title: 'Professional Email Writing', type: 'video', duration: '45 min' },
        { title: 'Presentation Skills', type: 'video', duration: '55 min' },
        { title: 'Meeting & Negotiation Language', type: 'video', duration: '50 min' },
        { title: 'Report Writing', type: 'document', duration: '40 min' },
      ]},
      { title: 'Module 4: Exam Preparation', lessons: [
        { title: 'IELTS Overview & Strategy', type: 'video', duration: '60 min' },
        { title: 'IELTS Speaking Practice', type: 'video', duration: '45 min' },
        { title: 'IELTS Writing Task 1 & 2', type: 'document', duration: '50 min' },
        { title: 'Practice Test', type: 'quiz', duration: '90 min' },
        { title: 'Final Assessment', type: 'quiz', duration: '60 min' },
      ]},
    ],
    reviewsList: [
      { name: 'Amina Kabuya', rating: 5, date: 'Feb 2026', text: 'Incredible course! Prof. Marie-Claire is an amazing teacher. I went from basic English to confidently speaking at work in just 6 months.' },
      { name: 'Patrick Kiza', rating: 5, date: 'Jan 2026', text: 'The IELTS preparation section is top-notch. I scored 7.5 on my exam after completing this course. Highly recommended!' },
      { name: 'Grace Muhindo', rating: 4, date: 'Dec 2025', text: 'Very well structured curriculum. The business English module helped me get a promotion at my company.' },
    ],
  },
  '2': {
    id: 2, title: 'French Language', icon: Globe, color: '#2563eb', img: classroomImg,
    level: 'All Levels', duration: '3-12 months', students: 145, price: 45, rating: 4.8, reviews: 62,
    description: 'Professional French for communication, DELF/DALF exam preparation, and business French. Master the diplomatic language and key to professional opportunities across Africa and Europe.',
    instructor: { name: 'Mr. Jonas Masudi', title: 'French Language Specialist', bio: 'Native French speaker with expertise in DELF/DALF preparation. 10+ years teaching experience with Alliance Française methodology.', img: instructorImg, courses: 3, students: 240 },
    whatYouLearn: ['French grammar from A1 to C1 levels', 'DELF/DALF exam preparation', 'Business French communication', 'Academic French writing', 'Conversational fluency', 'Cultural immersion activities'],
    requirements: ['No prior French knowledge required', 'Basic reading ability', 'Regular class attendance recommended'],
    curriculum: [
      { title: 'Module 1: Basics (A1-A2)', lessons: [
        { title: 'Introduction to French', type: 'video', duration: '40 min', preview: true },
        { title: 'Basic Grammar & Conjugation', type: 'video', duration: '50 min' },
        { title: 'Vocabulary Essentials', type: 'document', duration: '30 min' },
        { title: 'Quiz: Foundations', type: 'quiz', duration: '20 min' },
      ]},
      { title: 'Module 2: Intermediate (B1)', lessons: [
        { title: 'Passé Composé vs Imparfait', type: 'video', duration: '55 min', preview: true },
        { title: 'Written Expression', type: 'document', duration: '40 min' },
        { title: 'Oral Communication', type: 'video', duration: '45 min' },
        { title: 'DELF B1 Practice', type: 'quiz', duration: '60 min' },
      ]},
    ],
    reviewsList: [
      { name: 'Fatuma Hassan', rating: 5, date: 'Jan 2026', text: 'Passed my DELF B1 with 85% thanks to BTC! Mr. Masudi is an excellent instructor.' },
      { name: 'David Nkunda', rating: 5, date: 'Dec 2025', text: 'The methodology is perfect for African French learners. Great cultural context.' },
    ],
  },
  '5': {
    id: 5, title: 'Computer Science & IT', icon: Monitor, color: '#0891b2', img: studentImg,
    level: 'Beginner to Pro', duration: '6-12 months', students: 120, price: 60, rating: 4.9, reviews: 54,
    description: 'From digital literacy to full-stack web development. Learn programming, office tools, networking, and modern software development. Practical projects and real-world applications.',
    instructor: { name: 'Mr. David Kirabo', title: 'Head of IT & Digital', bio: 'Computer science trainer and digital transformation specialist with industry experience at tech companies across East Africa.', img: instructorImg, courses: 4, students: 200 },
    whatYouLearn: ['Microsoft Office proficiency', 'HTML, CSS & JavaScript', 'Python programming', 'Database fundamentals', 'Web development with React', 'Networking & IT support'],
    requirements: ['Basic computer familiarity helpful', 'No coding experience required', 'Access to a computer for practice'],
    curriculum: [
      { title: 'Module 1: Digital Literacy', lessons: [
        { title: 'Computer Basics', type: 'video', duration: '40 min', preview: true },
        { title: 'Microsoft Word', type: 'video', duration: '50 min' },
        { title: 'Microsoft Excel', type: 'video', duration: '60 min' },
        { title: 'Internet & Email', type: 'document', duration: '30 min' },
      ]},
      { title: 'Module 2: Web Development', lessons: [
        { title: 'HTML Basics', type: 'video', duration: '55 min', preview: true },
        { title: 'CSS Styling', type: 'video', duration: '60 min' },
        { title: 'JavaScript Intro', type: 'video', duration: '75 min' },
        { title: 'Build a Website Project', type: 'document', duration: '90 min' },
      ]},
      { title: 'Module 3: Python Programming', lessons: [
        { title: 'Python Variables & Types', type: 'video', duration: '45 min' },
        { title: 'Control Flow', type: 'video', duration: '50 min' },
        { title: 'Functions & Modules', type: 'video', duration: '55 min' },
        { title: 'Final Project', type: 'quiz', duration: '120 min' },
      ]},
    ],
    reviewsList: [
      { name: 'Jean-Pierre Mutombo', rating: 5, date: 'Feb 2026', text: 'Mr. Kirabo is an incredible teacher. I now work as a freelance web developer thanks to this course!' },
      { name: 'Emmanuel Bahati Jr.', rating: 5, date: 'Jan 2026', text: 'The hands-on approach makes all the difference. Real projects from day one.' },
    ],
  },
};

// Fallback for any course ID
function getCourse(id: string): CourseData {
  if (allCourses[id]) return allCourses[id];
  return allCourses['1']; // Default fallback
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video size={14} className="text-blue-500" />;
    case 'document': return <FileText size={14} className="text-green-500" />;
    case 'quiz': return <Star size={14} className="text-yellow-500" />;
    default: return <BookOpen size={14} />;
  }
};

export function CourseDetail() {
  const { id } = useParams();
  const course = getCourse(id || '1');
  const [expandedModule, setExpandedModule] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [liked, setLiked] = useState(false);

  const totalLessons = course.curriculum.reduce((a, m) => a + m.lessons.length, 0);
  const totalDuration = course.curriculum.reduce((a, m) => a + m.lessons.reduce((b, l) => {
    const mins = parseInt(l.duration);
    return b + (isNaN(mins) ? 0 : mins);
  }, 0), 0);

  return (
    <div className="pt-20 bg-white dark:bg-gray-950 min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.color}ee, ${course.color}bb)` }}>
        <div className="absolute inset-0 opacity-10">
          <img src={course.img} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Programs
          </Link>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium mb-4">
                <course.icon size={14} /> {course.level}
              </div>
              <h1 className="text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2 }}>
                {course.title}
              </h1>
              <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-2xl">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mb-6">
                <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400 fill-yellow-400" /> {course.rating} ({course.reviews} reviews)</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {course.students} students</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {course.duration}</span>
                <span className="flex items-center gap-1.5"><BookOpen size={14} /> {totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={course.instructor.img} alt={course.instructor.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                <div>
                  <p className="text-white text-sm font-semibold">{course.instructor.name}</p>
                  <p className="text-white/70 text-xs">{course.instructor.title}</p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="relative mb-4 rounded-xl overflow-hidden">
                <img src={course.img} alt={course.title} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play size={22} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>${course.price}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>
              </div>
              <Link
                to="/portal"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-all mb-3"
                style={{ background: course.color }}
              >
                Enroll Now <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{ borderColor: course.color, color: course.color }}
              >
                Request Info
              </Link>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setLiked(!liked)} className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> Wishlist
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                  <Share2 size={14} /> Share
                </button>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                {[
                  { label: 'Duration', value: course.duration },
                  { label: 'Level', value: course.level },
                  { label: 'Lessons', value: `${totalLessons} lessons` },
                  { label: 'Total Hours', value: `${Math.round(totalDuration / 60)}+ hours` },
                  { label: 'Certificate', value: 'Yes, upon completion' },
                  { label: 'Location', value: 'Goma, DRC + Online' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit mb-8">
          {(['overview', 'curriculum', 'reviews'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* What you'll learn */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>What You'll Learn</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {course.whatYouLearn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: course.color }} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>About This Course</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
                    This program is offered at BTC's Goma campus with hybrid online/in-person options available.
                    Students receive hands-on training, mentorship, and career support throughout the program.
                    All graduates receive an officially recognized BTC certificate that is valued by employers in DRC and across Africa.
                  </p>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Requirements</h3>
                  <ul className="space-y-2">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <ArrowRight size={14} className="mt-0.5 shrink-0" style={{ color: course.color }} />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructor */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Your Instructor</h3>
                  <div className="flex items-start gap-4">
                    <img src={course.instructor.img} alt={course.instructor.name} className="w-20 h-20 rounded-2xl object-cover" />
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{course.instructor.name}</h4>
                      <p className="text-sm font-medium mb-2" style={{ color: course.color }}>{course.instructor.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{course.instructor.bio}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen size={12} /> {course.instructor.courses} courses</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {course.instructor.students} students</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {course.rating} rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'curriculum' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{course.curriculum.length} modules, {totalLessons} lessons, ~{Math.round(totalDuration / 60)} hours</p>
                  <button onClick={() => setExpandedModule(expandedModule === -1 ? 0 : -1)} className="text-xs font-medium" style={{ color: course.color }}>
                    {expandedModule === -1 ? 'Expand All' : 'Collapse All'}
                  </button>
                </div>
                {course.curriculum.map((module, mi) => (
                  <div key={mi} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => setExpandedModule(expandedModule === mi ? -1 : mi)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: course.color }}>
                          {mi + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{module.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{module.lessons.length} lessons</p>
                        </div>
                      </div>
                      {expandedModule === mi ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                    {expandedModule === mi && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-gray-700">
                        {module.lessons.map((lesson, li) => (
                          <div key={li} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                            {typeIcon(lesson.type)}
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{lesson.title}</span>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1"><Clock size={11} /> {lesson.duration}</span>
                              {lesson.preview && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${course.color}15`, color: course.color }}>Preview</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Rating Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{course.rating}</div>
                      <div className="flex gap-0.5 justify-center my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{course.reviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const pct = stars === 5 ? 82 : stars === 4 ? 14 : stars === 3 ? 3 : 1;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="w-2 text-gray-500">{stars}</span>
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-500">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                {course.reviewsList.map((review, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: course.color }}>
                        {review.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{review.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(review.rating)].map((_, j) => (
                          <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.text}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar - Related Courses */}
          <div className="space-y-5 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Related Programs</h3>
              <div className="space-y-3">
                {Object.values(allCourses).filter(c => c.id !== course.id).slice(0, 3).map(rc => (
                  <Link key={rc.id} to={`/courses/${rc.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${rc.color}20` }}>
                      <rc.icon size={18} style={{ color: rc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{rc.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">${rc.price}/mo</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs text-yellow-500">
                      <Star size={10} fill="currentColor" /> {rc.rating}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Need Help Choosing?</h4>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">Our academic advisors can help you find the perfect program for your goals.</p>
              <Link to="/contact" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: course.color }}>
                Talk to an Advisor <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
