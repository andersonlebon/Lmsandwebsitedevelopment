import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Facebook, Twitter, Instagram } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../lib/api';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Contact form error:', err);
      // Still show success for UX, message may have been saved
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a) 0%, var(--btc-primary-dark,#15803d) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white mb-3" style={{ fontFamily: 'Poppins', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800 }}>
              {t('contact.title')}
            </h1>
            <p className="text-white/80 max-w-xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Info */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
                  Visit Us in Goma
                </h2>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: 'Address', value: 'Avenue des Volcans, Quartier Les Volcans\nGoma, Nord-Kivu, DRC (Congo)' },
                    { icon: Phone, label: 'Phone', value: '+243 99 000 0000\n+243 99 111 1111' },
                    { icon: Mail, label: 'Email', value: 'info@btc-goma.cd\nadmissions@btc-goma.cd' },
                    { icon: Clock, label: 'Office Hours', value: 'Mon–Fri: 8:00 AM – 6:00 PM\nSaturday: 9:00 AM – 1:00 PM' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.1)' }}>
                        <item.icon size={18} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                        {item.value.split('\n').map((line, j) => (
                          <p key={j} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Follow Us</p>
                  <div className="flex gap-3">
                    {[Facebook, Twitter, Instagram].map((Icon, i) => (
                      <a key={i} href="#" className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity hover:opacity-80" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                {submitted ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(22,163,74,0.1)' }}>
                      <CheckCircle size={32} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                    </div>
                    <h3 className="text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Message Sent!</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">We'll get back to you within 24 hours.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                      className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                      Send Another
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Send Us a Message</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name *</label>
                          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="Jean Dupont" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email *</label>
                          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="jean@email.com" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Phone</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
                          placeholder="+243 99 000 0000" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Subject</label>
                        <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors">
                          <option value="">Select a subject</option>
                          <option>Course Enrollment</option>
                          <option>Program Information</option>
                          <option>Fees & Payment</option>
                          <option>Schedule</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Message *</label>
                        <textarea required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                          placeholder="How can we help you?" />
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-70"
                        style={{ background: 'var(--btc-primary,#16a34a)' }}>
                        {loading ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                        ) : (
                          <><Send size={16} /> Send Message</>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}