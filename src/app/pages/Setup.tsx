import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Lock, CheckCircle, AlertCircle, Loader2, Database, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../lib/api';
import btcLogo from 'figma:asset/a830ae5c9e57e0e708aaa9224b0dd9363e9028d9.png';

export function Setup() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [dbNotReady, setDbNotReady] = useState(false);
  const [dbError, setDbError] = useState('');
  const [checkingDb, setCheckingDb] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  // Check DB health, then check if admin already exists
  useEffect(() => {
    async function checkSetup() {
      try {
        // 1. Check if DB table is accessible
        const dbCheck = await apiFetch('/db-check').catch((e: any) => ({ status: 'error', error: e.message }));
        if (dbCheck.status === 'error') {
          setDbNotReady(true);
          setDbError(dbCheck.guidance || dbCheck.error || 'Database table not accessible');
          setChecking(false);
          return;
        }

        // 2. Check if admin already exists
        const data = await apiFetch('/seed-admin', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (data.message?.includes('already exists') || data.success) {
          setAlreadySetup(true);
        }
        // If data.needsPassword is true, admin doesn't exist yet — show setup form (default)
      } catch (e: any) {
        if (e.message?.includes('Database table not ready')) {
          setDbNotReady(true);
          setDbError(e.message);
        } else {
          console.log('Setup check:', e.message);
        }
      } finally {
        setChecking(false);
      }
    }
    checkSetup();
  }, []);

  const handleRetryDbCheck = async () => {
    setCheckingDb(true);
    setDbError('');
    try {
      const dbCheck = await apiFetch('/db-check');
      if (dbCheck.status === 'ok') {
        setDbNotReady(false);
      } else {
        setDbError(dbCheck.guidance || dbCheck.error || 'Still not accessible');
      }
    } catch (e: any) {
      setDbError(e.message || 'Database check failed');
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(lang === 'fr' ? 'Le mot de passe doit contenir au moins 6 caracteres.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch('/seed-admin', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (result.needsTableSetup) {
        setDbNotReady(true);
        setDbError(result.error || 'Database table not ready');
        setLoading(false);
        return;
      }

      if (result.success || result.message?.includes('already exists')) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } else if (result.error) {
        setError(result.hint ? `${result.error}\n\nHint: ${result.hint}` : result.error);
      }
    } catch (err: any) {
      console.error('Setup error:', err);
      const msg = err.message || 'Setup failed';
      if (msg.includes('Database table not ready') || msg.includes('schema cache') || msg.includes('does not exist')) {
        setDbNotReady(true);
        setDbError(msg);
      } else if (msg.includes('handle_new_user') || msg.includes('Database error')) {
        setError(`${msg}\n\nThis is likely a database trigger issue. Go to Supabase Dashboard → SQL Editor and run:\n\nCREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO profiles (id, email, name, role, phone) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'student', COALESCE(NEW.raw_user_meta_data->>'phone', '')) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, profiles.name), updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // Database table not ready — show setup instructions
  if (dbNotReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Database size={32} className="text-amber-500" />
            </div>
            <h1 className="text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.4rem' }}>
              {lang === 'fr' ? 'Base de donnees requise' : 'Database Setup Required'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {lang === 'fr'
                ? 'La table de base de donnees n\'est pas encore prete. Suivez les etapes ci-dessous.'
                : 'The database table is not ready yet. Follow the steps below.'}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6 space-y-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {lang === 'fr' ? 'Instructions' : 'Instructions'}
            </p>
            <div className="space-y-3">
              {[
                lang === 'fr'
                  ? 'Ouvrez Supabase Dashboard > SQL Editor'
                  : 'Open Supabase Dashboard > SQL Editor',
                lang === 'fr'
                  ? 'Executez cette requete SQL :'
                  : 'Run this SQL query:',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                </div>
              ))}
            </div>

            {/* SQL Code Block */}
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre leading-relaxed">
{`CREATE TABLE IF NOT EXISTS kv_store_36dfb453 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);`}
              </pre>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {lang === 'fr'
                  ? 'Cliquez sur "Run" puis revenez ici et cliquez "Reverifier".'
                  : 'Click "Run", then come back here and click "Re-check".'}
              </span>
            </div>
          </div>

          {/* Error details */}
          {dbError && (
            <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">{dbError}</p>
            </div>
          )}

          {/* Retry button */}
          <button
            onClick={handleRetryDbCheck}
            disabled={checkingDb}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #2E8B57, #00BCD4)' }}
          >
            {checkingDb ? (
              <><Loader2 size={16} className="animate-spin" /> {lang === 'fr' ? 'Verification...' : 'Checking...'}</>
            ) : (
              <><RefreshCw size={16} /> {lang === 'fr' ? 'Reverifier la base de donnees' : 'Re-check Database'}</>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #2E8B57, #00BCD4)' }}>
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Plateforme deja configuree' : 'Platform Already Set Up'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {lang === 'fr'
              ? 'Le compte super-administrateur existe deja. Vous pouvez vous connecter.'
              : 'The super admin account already exists. You can log in now.'}
          </p>
          <button onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #2E8B57, #00BCD4)' }}>
            {lang === 'fr' ? 'Aller a la connexion' : 'Go to Login'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #2E8B57, #00BCD4)' }}>
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Configuration terminee !' : 'Setup Complete!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {lang === 'fr'
              ? 'Le compte super-administrateur a ete cree avec succes.'
              : 'Super admin account has been created successfully.'}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
            buyananderson@gmail.com
          </p>
          <p className="text-xs text-gray-400">{lang === 'fr' ? 'Redirection vers la connexion...' : 'Redirecting to login...'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #2E8B57 0%, #00ACC1 50%, #00BCD4 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <img src={btcLogo} alt="BTC" className="w-20 h-20 rounded-2xl object-contain mx-auto mb-4 bg-gray-50 p-1" />
          <h1 className="text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem' }}>
            {lang === 'fr' ? 'Configuration initiale' : 'Platform Setup'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {lang === 'fr'
              ? 'Creez le mot de passe du super-administrateur pour lancer BTC.'
              : 'Set the super admin password to launch BTC.'}
          </p>
        </div>

        {/* Admin email info */}
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(46,139,87,0.1), rgba(0,188,212,0.1))' }}>
          <Shield size={20} style={{ color: '#2E8B57' }} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'fr' ? 'Email du Super Admin' : 'Super Admin Email'}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">buyananderson@gmail.com</p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="break-all">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {lang === 'fr' ? 'Mot de passe' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lang === 'fr' ? 'Minimum 6 caracteres' : 'Min. 6 characters'}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {lang === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={lang === 'fr' ? 'Repetez le mot de passe' : 'Repeat password'}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #2E8B57, #00BCD4)' }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {lang === 'fr' ? 'Creation...' : 'Creating...'}</>
            ) : (
              <><Shield size={16} /> {lang === 'fr' ? 'Creer le compte admin' : 'Create Admin Account'}</>
            )}
          </motion.button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          BTC — Brotherly Training Center · Goma, DRC
        </p>
      </motion.div>
    </div>
  );
}