import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
const btcLogo = '/images/btc-logo.png';

function roleRedirect(role: string): string {
  // Check if there's a pending payment from registration — redirect students to payments
  if (role === 'student') {
    const pendingPayment = localStorage.getItem('btc_pending_payment');
    if (pendingPayment) {
      return '/portal/payments';
    }
  }
  switch (role) {
    case 'admin': return '/dashboard';
    case 'staff': return '/staff';
    case 'student': return '/portal';
    default: return '/portal';
  }
}

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { signIn, user, loading: authLoading, resendConfirmation } = useAuth();
  const hasRedirected = useRef(false);

  // If user is already logged in, redirect to their dashboard
  useEffect(() => {
    if (!authLoading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate(roleRedirect(user.role), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotConfirmed(false);
    setResent(false);

    if (!form.email || !form.password) {
      setError(t('login.error'));
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(form.email, form.password);
      if (result.error) {
        const errMsg = result.error.toLowerCase();
        let displayError = result.error;
        if (errMsg.includes('invalid login') || errMsg.includes('invalid credentials')) {
          displayError = lang === 'fr' ? 'Email ou mot de passe incorrect.' : 'Invalid email or password.';
        } else if (errMsg.includes('email not confirmed') || errMsg.includes('not confirmed')) {
          displayError = lang === 'fr'
            ? 'Votre email n\'est pas encore confirme. Verifiez votre boite de reception et cliquez sur le lien de confirmation.'
            : 'Your email is not yet confirmed. Check your inbox and click the confirmation link.';
          setEmailNotConfirmed(true);
        }
        setError(displayError);
        setLoading(false);
        return;
      }
      // signIn sets user in context → useEffect above handles navigation
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || (lang === 'fr' ? 'Erreur de connexion.' : 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!form.email) return;
    setResending(true);
    setResent(false);
    const result = await resendConfirmation(form.email);
    if (!result.error) {
      setResent(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a) 0%, var(--btc-primary-dark,#15803d) 100%)' }}
      >
        {/* Decorative circles */}
        {[...Array(4)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full border border-white/10"
            style={{ width: 200 + i * 150, height: 200 + i * 150, right: -100 - i * 50, bottom: -100 - i * 50 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30 + i * 5, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <div className="relative z-10 text-center">
          <img src={btcLogo} alt="BTC" className="w-24 h-24 rounded-2xl object-contain bg-white/20 backdrop-blur-sm p-2 mx-auto mb-6" />
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '2.5rem' }} className="mb-3">BTC Portal</h1>
          <p className="text-white/80 text-lg mb-2">Brotherly Training Center</p>
          <p className="text-white/60 text-sm">{lang === 'fr' ? 'École de Langues et Métiers' : 'Language & Vocational School'}</p>
          <p className="text-white/60 text-sm mt-1">Goma, Nord-Kivu, DRC</p>

          <div className="mt-12 space-y-4">
            {[
              { label: lang === 'fr' ? 'Étudiants Inscrits' : 'Students Enrolled', value: '500+' },
              { label: lang === 'fr' ? 'Programmes Actifs' : 'Active Programs', value: '20+' },
              { label: lang === 'fr' ? "Années d'Excellence" : 'Years of Excellence', value: '10+' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center justify-between bg-white/10 rounded-xl px-5 py-3"
              >
                <span className="text-white/80 text-sm">{stat.label}</span>
                <span className="font-bold text-lg" style={{ fontFamily: 'Poppins' }}>{stat.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Role info badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { emoji: '🎓', label: lang === 'fr' ? 'Étudiant' : 'Student' },
              { emoji: '👨‍🏫', label: lang === 'fr' ? 'Personnel' : 'Staff' },
              { emoji: '🛡️', label: 'Admin' },
            ].map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs text-white/80">
                <span>{r.emoji}</span> {r.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={btcLogo} alt="BTC" className="w-10 h-10 rounded-xl object-contain bg-white/90 p-0.5" />
            <div>
              <div className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>BTC Portal</div>
              <div className="text-xs text-gray-500">Brotherly Training Center</div>
            </div>
          </div>

          <h2 className="text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.75rem' }}>{t('login.welcomeBack')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('login.signInSubtitle')}</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t('login.emailAddress')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@btc-goma.cd"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('login.enterPassword')}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                {t('login.rememberMe')}
              </label>
              <a href="#" className="hover:underline" style={{ color: 'var(--btc-primary,#2E8B57)' }}>{t('login.forgotPassword')}</a>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-70"
              style={{ background: 'var(--btc-primary,#16a34a)' }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('login.signingIn')}</>
              ) : (
                <>{t('login.signIn')} <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Role info for users */}
          <div className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {lang === 'fr' ? 'Accès selon votre rôle :' : 'Access based on your role:'}
            </p>
            <div className="space-y-1.5">
              {[
                { role: lang === 'fr' ? 'Administrateur' : 'Administrator', desc: lang === 'fr' ? 'Gestion complète de la plateforme' : 'Full platform management', color: '#ef4444' },
                { role: lang === 'fr' ? 'Personnel' : 'Staff', desc: lang === 'fr' ? 'Cours, présences et matériels' : 'Classes, attendance & materials', color: '#3b82f6' },
                { role: lang === 'fr' ? 'Étudiant' : 'Student', desc: lang === 'fr' ? 'Portail étudiant, cours et paiements' : 'Student portal, courses & payments', color: '#22c55e' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
                  <span className="text-gray-400">— {r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {emailNotConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-3 mb-3">
                <Mail size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                    {lang === 'fr' ? 'Email non confirmé' : 'Email Not Confirmed'}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {lang === 'fr'
                      ? 'Vérifiez votre boîte de réception (et le dossier spam) pour le lien de confirmation.'
                      : 'Check your inbox (and spam folder) for the confirmation link.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending || resent}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--btc-primary, #16a34a)' }}
              >
                {resending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {lang === 'fr' ? 'Envoi...' : 'Sending...'}</>
                ) : resent ? (
                  <><AlertCircle size={14} /> {lang === 'fr' ? 'Email renvoyé ! Vérifiez votre boîte.' : 'Email resent! Check your inbox.'}</>
                ) : (
                  <><Mail size={14} /> {lang === 'fr' ? 'Renvoyer l\'email de confirmation' : 'Resend Confirmation Email'}</>
                )}
              </button>
            </motion.div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mt-4 gap-4">
            <Link to="/" className="hover:underline" style={{ color: 'var(--btc-primary,#2E8B57)' }}>← {t('login.backToWebsite')}</Link>
            <Link to="/register" className="hover:underline font-medium" style={{ color: 'var(--btc-primary,#2E8B57)' }}>
              {lang === 'fr' ? 'Nouvel étudiant ? S\'inscrire' : 'New student? Register'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}