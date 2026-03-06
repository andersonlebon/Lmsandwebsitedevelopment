import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { User, BookOpen, Clock, CheckCircle, ArrowRight, ArrowLeft, GraduationCap, Phone, MapPin, Calendar, Users, AlertCircle, Mail, Loader2, Monitor, Car, Scissors } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
const btcLogo = '/images/btc-logo.png';

// Fallback hardcoded programs — used only if API returns nothing
const FALLBACK_PROGRAMS = [
  { id: 'eng-l1', department: 'english', name: 'Level 1', nameFr: 'Niveau 1', status: 'active', fees: [{ id: 'f1', name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: 50, currency: 'USD', type: 'monthly', required: true }] },
  { id: 'eng-l2', department: 'english', name: 'Level 2', nameFr: 'Niveau 2', status: 'active', fees: [{ id: 'f2', name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: 50, currency: 'USD', type: 'monthly', required: true }] },
  { id: 'cs-word', department: 'computer', name: 'Microsoft Word', nameFr: 'Microsoft Word', status: 'active', fees: [{ id: 'f3', name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: 40, currency: 'USD', type: 'monthly', required: true }] },
  { id: 'cs-full', department: 'computer', name: 'Full Computer Package', nameFr: 'Pack Informatique Complet', status: 'active', fees: [{ id: 'f4', name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: 60, currency: 'USD', type: 'monthly', required: true }] },
  { id: 'dr-full', department: 'driving', name: 'Full Driving Program', nameFr: 'Programme Complet de Conduite', status: 'active', fees: [{ id: 'f5', name: 'Full Program', nameFr: 'Programme Complet', amount: 200, currency: 'USD', type: 'one-time', required: true }] },
  { id: 'sw-beg', department: 'sewing', name: 'Beginner', nameFr: 'Débutant', status: 'active', fees: [{ id: 'f6', name: 'Monthly Tuition', nameFr: 'Frais mensuels', amount: 25, currency: 'USD', type: 'monthly', required: true }] },
];

interface Fee {
  id: string;
  name: string;
  nameFr: string;
  amount: number;
  currency: string;
  type: string;
  required: boolean;
}

interface Program {
  id: string;
  department: string;
  name: string;
  nameFr: string;
  status: string;
  fees: Fee[];
}

const DEPT_IDS = ['english', 'computer', 'driving', 'sewing'];

const timeSlots = [
  { id: '06:00', label: '6:00 – 7:30' },
  { id: '08:00', label: '8:00 – 9:30' },
  { id: '10:00', label: '10:00 – 11:30' },
  { id: '16:00', label: '4:00 – 7:30' },
];

export function Register() {
  const { t, lang } = useLanguage();
  const { signUp, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', gender: '', address: '', dob: '', referral: '',
    department: '', course: '', timeSlot: '',
  });

  // Dynamic programs from API
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Programs endpoint is public (no auth needed), use the anon key
        const { projectId, publicAnonKey } = await import('/utils/supabase/info');
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-36dfb453/programs`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          const active = (data.programs || []).filter((p: Program) => p.status === 'active');
          setPrograms(active.length > 0 ? active : FALLBACK_PROGRAMS);
        } else {
          setPrograms(FALLBACK_PROGRAMS);
        }
      } catch (e) {
        console.error('Failed to load programs:', e);
        setPrograms(FALLBACK_PROGRAMS);
      } finally {
        setLoadingPrograms(false);
      }
    })();
  }, []);

  const steps = [
    { label: t('reg.step1'), icon: User },
    { label: t('reg.step2'), icon: BookOpen },
    { label: t('reg.step3'), icon: Clock },
    { label: t('reg.step4'), icon: CheckCircle },
  ];

  const deptNames: Record<string, Record<string, string>> = {
    english: { en: 'English', fr: 'Anglais' },
    computer: { en: 'Computer Science', fr: 'Informatique' },
    driving: { en: 'Driving', fr: 'Conduite' },
    sewing: { en: 'Sewing', fr: 'Couture' },
  };

  const deptIcons: Record<string, any> = {
    english: GraduationCap,
    computer: Monitor,
    driving: Car,
    sewing: Scissors,
  };

  // Group programs by department
  const programsByDept: Record<string, Program[]> = {};
  programs.forEach(p => {
    if (!programsByDept[p.department]) programsByDept[p.department] = [];
    programsByDept[p.department].push(p);
  });

  // Get departments that have programs
  const activeDepts = DEPT_IDS.filter(id => (programsByDept[id] || []).length > 0);

  const selectedDeptPrograms = programsByDept[form.department] || [];
  const selectedProgram = programs.find(p => p.id === form.course);

  // Calculate total fees for display
  const programTotalFees = (selectedProgram?.fees || []).reduce((sum, f) => sum + f.amount, 0);
  const programFeeSummary = selectedProgram
    ? `$${programTotalFees}`
    : '';

  const canNext = () => {
    if (step === 0) return form.fullName && form.phone && form.gender && form.dob && form.email && form.password && form.password.length >= 6;
    if (step === 1) return form.department && form.course;
    if (step === 2) return form.timeSlot;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        name: form.fullName,
        role: 'student',
        phone: form.phone,
        department: form.department,
      });
      if (result.error) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      }

      // Store pending payment info so the Payments page can pre-fill after login
      localStorage.setItem('btc_pending_payment', JSON.stringify({
        courseName: lang === 'fr' ? (selectedProgram?.nameFr || selectedProgram?.name) : selectedProgram?.name,
        courseId: selectedProgram?.id || form.course,
        department: form.department,
        departmentName: deptNames[form.department]?.[lang],
        price: programFeeSummary,
        timeSlot: timeSlots.find(s => s.id === form.timeSlot)?.label || '',
        studentName: form.fullName,
        email: form.email,
      }));

      setSubmitted(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setSubmitError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    setResent(false);
    setSubmitError('');
    try {
      const result = await resendConfirmation(form.email);
      if (result.error) {
        setSubmitError(result.error);
        setResending(false);
        return;
      }
      setResent(true);
    } catch (err: any) {
      console.error('Resend confirmation error:', err);
      setSubmitError(err.message || 'Failed to resend confirmation');
    } finally {
      setResending(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm';
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          {/* Registration success header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#16a34a), #00BCD4)' }}>
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
              {lang === 'fr' ? 'Inscription réussie !' : 'Registration Successful!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {lang === 'fr'
                ? 'Votre compte a été créé. Passez au paiement pour compléter votre inscription.'
                : 'Your account has been created. Proceed to payment to complete your enrollment.'}
            </p>
          </div>

          {/* Course & Payment Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <BookOpen size={16} style={{ color: 'var(--btc-primary,#16a34a)' }} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {lang === 'fr' ? 'Résumé de l\'inscription' : 'Enrollment Summary'}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reg.fullName')}</span>
                <span className="text-gray-900 dark:text-white font-medium">{form.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reg.department')}</span>
                <span className="text-gray-900 dark:text-white font-medium">{deptNames[form.department]?.[lang]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reg.course')}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {lang === 'fr' ? (selectedProgram?.nameFr || selectedProgram?.name) : selectedProgram?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reg.schedule')}</span>
                <span className="text-gray-900 dark:text-white font-medium">{timeSlots.find(s => s.id === form.timeSlot)?.label}</span>
              </div>
              {/* Fee breakdown */}
              {(selectedProgram?.fees || []).length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'fr' ? 'Frais du Programme' : 'Program Fees'}
                  </span>
                  {selectedProgram!.fees.map(fee => (
                    <div key={fee.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">{lang === 'fr' ? (fee.nameFr || fee.name) : fee.name}</span>
                      <span className="font-semibold" style={{ color: 'var(--btc-primary,#16a34a)' }}>${fee.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Total' : 'Total'}</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--btc-primary,#16a34a)' }}>${programTotalFees}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next steps - either email confirmation flow or direct to payments */}
          {needsConfirmation ? (
            <div className="space-y-4">
              {/* Steps indicator */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  {lang === 'fr' ? 'Prochaines étapes' : 'Next Steps'}
                </p>
                <div className="space-y-4">
                  {[
                    {
                      num: 1,
                      title: lang === 'fr' ? 'Confirmez votre email' : 'Confirm your email',
                      desc: lang === 'fr'
                        ? `Ouvrez votre boîte mail (${form.email}) et cliquez sur le lien de confirmation.`
                        : `Open your inbox (${form.email}) and click the confirmation link.`,
                      active: true,
                    },
                    {
                      num: 2,
                      title: lang === 'fr' ? 'Connectez-vous' : 'Sign in',
                      desc: lang === 'fr' ? 'Utilisez votre email et mot de passe.' : 'Use your email and password.',
                      active: false,
                    },
                    {
                      num: 3,
                      title: lang === 'fr' ? 'Effectuez votre paiement' : 'Make your payment',
                      desc: lang === 'fr' ? 'Vous serez redirigé vers la page de paiement automatiquement.' : 'You will be redirected to the payment page automatically.',
                      active: false,
                    },
                  ].map((s) => (
                    <div key={s.num} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        s.active ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`} style={s.active ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                        {s.num}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${s.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{s.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spam warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {lang === 'fr'
                    ? "N'oubliez pas de vérifier votre dossier spam si vous ne voyez pas l'email de confirmation."
                    : "Don't forget to check your spam folder if you don't see the confirmation email."}
                </p>
              </div>

              {/* Resend confirmation */}
              <div>
                {resent ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {lang === 'fr' ? 'Email renvoyé avec succès !' : 'Email resent successfully!'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    {resending ? (
                      <><span className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" /> {lang === 'fr' ? 'Envoi en cours...' : 'Sending...'}</>
                    ) : (
                      <><Mail size={14} /> {lang === 'fr' ? 'Renvoyer l\'email de confirmation' : 'Resend Confirmation Email'}</>
                    )}
                  </button>
                )}
              </div>

              {/* Go to login CTA */}
              <Link to="/login" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ background: 'var(--btc-primary,#16a34a)' }}>
                {lang === 'fr' ? 'J\'ai confirmé — Me connecter et payer' : 'I\'ve confirmed — Sign in & Pay'} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <Link to="/portal/payments" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ background: 'var(--btc-primary,#16a34a)' }}>
                {lang === 'fr' ? 'Passer au Paiement' : 'Proceed to Payment'} <ArrowRight size={16} />
              </Link>
              <Link to="/portal" className="w-full flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                {t('common.myDashboard')}
              </Link>
            </div>
          )}

          {submitError && (
            <div className="mt-4 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle size={16} /> {submitError}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="py-6 px-4" style={{ background: 'linear-gradient(135deg, var(--btc-primary,#2E8B57), var(--btc-primary-dark,#00ACC1))' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/">
            <img src={btcLogo} alt="BTC" className="w-10 h-10 rounded-xl object-contain bg-white/90 p-0.5" />
          </Link>
          <div>
            <h1 className="text-white" style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.4rem' }}>{t('reg.title')}</h1>
            <p className="text-white/80 text-sm">{t('reg.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  i <= step ? 'text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`} style={i <= step ? { background: 'var(--btc-primary,#2E8B57)' } : {}}>
                  {i < step ? <CheckCircle size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${i < step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} style={i < step ? { background: 'var(--btc-primary,#2E8B57)' } : {}} />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm">

            {step === 0 && (
              <div className="space-y-5">
                <h3 className="text-lg text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('reg.step1')}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('reg.fullName')} *</label>
                    <input className={inputCls} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Ex: Amina Kabuya" />
                  </div>
                  <div>
                    <label className={labelCls}>{t('reg.phone')} *</label>
                    <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+243 ..." />
                  </div>
                  <div>
                    <label className={labelCls}>{t('reg.gender')} *</label>
                    <div className="flex gap-3">
                      {['male', 'female'].map(g => (
                        <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                          className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.gender === g ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          {t(`reg.${g}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t('reg.dob')} *</label>
                    <input type="date" className={inputCls} value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('reg.address')}</label>
                  <input className={inputCls} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Goma, Nord-Kivu" />
                </div>
                <div>
                  <label className={labelCls}>{t('reg.referral')}</label>
                  <input className={inputCls} value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} placeholder={lang === 'fr' ? 'Un ami, les réseaux sociaux, etc.' : 'A friend, social media, etc.'} />
                </div>
                <div>
                  <label className={labelCls}>{t('reg.email')} *</label>
                  <input className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@example.com" />
                </div>
                <div>
                  <label className={labelCls}>{t('reg.password')} *</label>
                  <input className={inputCls} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('reg.step2')}</h3>

                {loadingPrograms ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>{t('reg.department')} *</label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {activeDepts.map(deptId => {
                          const Icon = deptIcons[deptId] || BookOpen;
                          const selected = form.department === deptId;
                          return (
                            <button key={deptId} onClick={() => setForm(f => ({ ...f, department: deptId, course: '' }))}
                              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <span className={`font-medium text-sm ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {deptNames[deptId]?.[lang]}
                                </span>
                                <p className="text-xs text-gray-400">{(programsByDept[deptId] || []).length} {lang === 'fr' ? 'programmes' : 'programs'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedDeptPrograms.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className={labelCls}>{lang === 'fr' ? 'Programme / Niveau' : 'Program / Level'} *</label>
                        <div className="space-y-2">
                          {selectedDeptPrograms.map(program => {
                            const selected = form.course === program.id;
                            const totalFees = program.fees.reduce((s, f) => s + f.amount, 0);
                            return (
                              <button key={program.id} onClick={() => setForm(f => ({ ...f, course: program.id }))}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                                  <div className="text-left">
                                    <span className={`text-sm font-medium ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {lang === 'fr' ? (program.nameFr || program.name) : program.name}
                                    </span>
                                    {program.fees.length > 0 && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {program.fees.length} {lang === 'fr' ? 'frais' : 'fees'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold" style={{ color: 'var(--btc-primary,#2E8B57)' }}>
                                    ${totalFees}
                                  </span>
                                  {program.fees.some(f => f.type === 'monthly') && (
                                    <p className="text-xs text-gray-400">{lang === 'fr' ? '/mois' : '/month'}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Show fee breakdown when a program is selected */}
                    {selectedProgram && selectedProgram.fees.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                          {lang === 'fr' ? 'Détail des Frais' : 'Fee Breakdown'}
                        </p>
                        <div className="space-y-2">
                          {selectedProgram.fees.map(fee => (
                            <div key={fee.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300">
                                {lang === 'fr' ? (fee.nameFr || fee.name) : fee.name}
                                {fee.required && <span className="text-red-500 ml-1">*</span>}
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white">${fee.amount}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                            <span className="font-bold" style={{ color: 'var(--btc-primary,#16a34a)' }}>${programTotalFees}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('reg.step3')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('reg.schedule')}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {timeSlots.map(slot => {
                    const selected = form.timeSlot === slot.id;
                    return (
                      <button key={slot.id} onClick={() => setForm(f => ({ ...f, timeSlot: slot.id }))}
                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                          <Clock size={20} />
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{slot.label}</p>
                          <p className="text-xs text-gray-400">{lang === 'fr' ? 'Lundi – Vendredi' : 'Monday – Friday'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>{t('reg.step4')}</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
                  {[
                    { label: t('reg.fullName'), value: form.fullName },
                    { label: t('reg.phone'), value: form.phone },
                    { label: t('reg.gender'), value: form.gender === 'male' ? t('reg.male') : t('reg.female') },
                    { label: t('reg.dob'), value: form.dob },
                    { label: t('reg.address'), value: form.address || '—' },
                    { label: t('reg.referral'), value: form.referral || '—' },
                    { label: t('reg.department'), value: deptNames[form.department]?.[lang] || '' },
                    { label: lang === 'fr' ? 'Programme' : 'Program', value: (lang === 'fr' ? (selectedProgram?.nameFr || selectedProgram?.name) : selectedProgram?.name) || '' },
                    { label: t('reg.schedule'), value: timeSlots.find(s => s.id === form.timeSlot)?.label || '' },
                    { label: lang === 'fr' ? 'Total Frais' : 'Total Fees', value: programFeeSummary },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all">
            <ArrowLeft size={16} /> {t('common.previous')}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: 'var(--btc-primary,#2E8B57)' }}>
              {t('common.next')} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
              style={{ background: 'var(--btc-primary,#2E8B57)' }}>
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('reg.submit')} <CheckCircle size={16} />
                </>
              )}
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-red-500 flex items-center gap-2">
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          {t('reg.alreadyStudent')} <Link to="/login" className="font-medium" style={{ color: 'var(--btc-primary,#2E8B57)' }}>{t('reg.loginHere')}</Link>
        </p>
      </div>
    </div>
  );
}