import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router';
import { GraduationCap, Target, Heart, Globe, Users, Award, ArrowRight, MapPin, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const teacherImg = 'https://images.unsplash.com/photo-1690192435015-319c1d5065b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800';
const studentsImg = 'https://images.unsplash.com/photo-1741699427799-3fbb70fce948?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800';
const trainingImg = 'https://images.unsplash.com/photo-1740205642946-72e75a92124b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>
      {children}
    </motion.div>
  );
}

const team = [
  { name: 'Dr. Emmanuel Bahati', role: 'Founder & Director', bio: '15+ years in education management and language instruction across Central Africa.', img: teacherImg },
  { name: 'Prof. Marie-Claire Nzigire', role: 'Academic Coordinator', bio: 'Expert in French linguistics and curriculum design with DELF certification authority.', img: studentsImg },
  { name: 'Mr. David Kirabo', role: 'Head of IT & Digital', bio: 'Computer science trainer and digital transformation specialist.', img: trainingImg },
];

const milestones = [
  { year: '2014', event: 'BTC Founded in Goma with 30 students' },
  { year: '2016', event: 'Launched computer science and IT programs' },
  { year: '2018', event: 'First 100 graduates placed in international organizations' },
  { year: '2020', event: 'Introduced online learning platform during pandemic' },
  { year: '2022', event: 'Expanded to 8 languages including Arabic and Chinese' },
  { year: '2024', event: 'Achieved 500+ active students with 95% job placement' },
];

export function About() {
  const { language } = useLanguage();
  return (
    <div className="pt-20 bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a) 0%, var(--btc-primary-dark,#15803d) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm mb-6">
              <MapPin size={14} /> Goma, Nord-Kivu, DRC
            </div>
            <h1 className="text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800 }}>
              About BTC
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
              The Brotherly Training Center — <em>École de Langues et Métiers</em> — transforming lives in Goma through education since 2014.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission/Vision/Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: 'Our Mission', color: '#16a34a', text: 'To provide accessible, high-quality language and vocational training that empowers every individual to achieve professional excellence and contribute to the development of DRC.' },
              { icon: Globe, title: 'Our Vision', color: '#2563eb', text: 'To be the leading institution for language and skills training in Central Africa, producing graduates who compete globally and lead locally.' },
              { icon: Heart, title: 'Our Values', color: '#e11d48', text: 'Excellence, Integrity, Inclusivity, Innovation, and Community. We believe every student deserves a chance to succeed regardless of background.' },
            ].map((item, i) => (
              <AnimatedSection key={i}>
                <motion.div whileHover={{ y: -4 }} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 h-full border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}20` }}>
                    <item.icon size={24} style={{ color: item.color }} />
                  </div>
                  <h3 className="text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.text}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <img src={teacherImg} alt="BTC Story" className="w-full h-80 object-cover rounded-2xl shadow-xl" />
            </AnimatedSection>
            <AnimatedSection>
              <h2 className="text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>
                Our Story
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-sm">
                BTC was born from a simple but powerful belief: that every young person in Goma deserves access to quality education that prepares them for the real world. Founded in 2014 by a group of passionate educators, BTC started with just 30 students and a single classroom.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                Today, we have trained over 500 students in languages, computing, accounting, design, and more. Our graduates work at international NGOs, embassies, private companies, and across the DRC and beyond.
              </p>
              <ul className="space-y-3">
                {['Certified by Ministry of Education, DRC', 'Partner institution with Alliance Française', 'Cambridge English Testing Center', 'Microsoft Digital Literacy Partner'].map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={16} style={{ color: 'var(--btc-primary,#16a34a)', flexShrink: 0 }} />
                    {i}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>Our Journey</h2>
          </AnimatedSection>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 to-green-200 dark:to-green-900" />
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-start gap-6 mb-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                <div className="relative z-10 w-4 h-4 rounded-full border-4 border-white dark:border-gray-950 mt-1.5 flex-shrink-0 md:mx-auto" style={{ background: 'var(--btc-primary,#16a34a)', marginLeft: i % 2 !== 0 ? 'auto' : undefined }} />
                <div className={`flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? 'md:mr-8 ml-8 md:ml-0' : 'md:ml-8 ml-8'}`}>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white mb-2 inline-block" style={{ background: 'var(--btc-primary,#16a34a)' }}>{m.year}</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{m.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>Meet Our Team</h2>
            <p className="text-gray-600 dark:text-gray-400">Dedicated professionals committed to your success.</p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
              >
                <img src={member.img} alt={member.name} className="w-full h-52 object-cover" />
                <div className="p-6">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>{member.name}</h3>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--btc-primary,#16a34a)' }}>{member.role}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white dark:bg-gray-950 text-center">
        <AnimatedSection>
          <h2 className="text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>
            Join the BTC Family
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start your journey with us today.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all" style={{ background: 'var(--btc-primary,#16a34a)' }}>
            Get in Touch <ArrowRight size={16} />
          </Link>
        </AnimatedSection>
      </section>
    </div>
  );
}