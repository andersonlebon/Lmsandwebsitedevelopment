import { useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Loader2, ShieldAlert, Mail, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

/** Maps a role to its "home" route (role compared case-insensitively) */
function roleHome(role: UserRole): string {
  const r = (role && String(role).toLowerCase()) || '';
  if (r === 'admin') return '/dashboard';
  if (r === 'staff') return '/staff';
  if (r === 'student') return '/portal';
  return '/login';
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, session, resendConfirmation, signOut } = useAuth();
  const { lang } = useLanguage();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  // Still loading auth state — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--btc-primary, #2E8B57)' }} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Session exists but profile hasn't propagated yet — wait instead of redirecting
  if (session && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--btc-primary, #2E8B57)' }} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Chargement du profil...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  // No session / not logged in → redirect to login
  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  // User email not confirmed → block access with confirmation screen
  if (!user.emailConfirmed) {
    const handleResend = async () => {
      setResending(true);
      setResendError('');
      setResent(false);
      const result = await resendConfirmation(user.email);
      if (result.error) {
        setResendError(result.error);
      } else {
        setResent(true);
      }
      setResending(false);
    };

    const handleSignOut = async () => {
      await signOut();
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-md w-full">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
            <Mail size={40} className="text-amber-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins' }}>
            {lang === 'fr' ? 'Confirmez votre email' : 'Confirm Your Email'}
          </h2>

          {/* Message */}
          <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
            {lang === 'fr'
              ? 'Votre adresse email n\'est pas encore confirmee. Veuillez verifier votre boite de reception et cliquer sur le lien de confirmation.'
              : 'Your email address is not yet confirmed. Please check your inbox and click the confirmation link.'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
            {user.email}
          </p>

          {/* Info box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
              {lang === 'fr'
                ? "Un email de confirmation a ete envoye lors de votre inscription. Verifiez votre dossier spam si vous ne le trouvez pas."
                : "A confirmation email was sent when you registered. Check your spam folder if you can't find it."}
            </p>
          </div>

          {/* Resend success */}
          {resent && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400">
                {lang === 'fr'
                  ? 'Email de confirmation renvoye avec succes !'
                  : 'Confirmation email resent successfully!'}
              </p>
            </div>
          )}

          {/* Resend error */}
          {resendError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{resendError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--btc-primary, #2E8B57)' }}
            >
              {resending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {lang === 'fr' ? 'Envoi en cours...' : 'Sending...'}
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  {lang === 'fr' ? 'Renvoyer l\'email de confirmation' : 'Resend Confirmation Email'}
                </>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <LogOut size={14} />
              {lang === 'fr' ? 'Se deconnecter' : 'Sign Out'}
            </button>

            <Link
              to="/"
              className="inline-block text-sm hover:underline mt-2"
              style={{ color: 'var(--btc-primary, #2E8B57)' }}
            >
              {lang === 'fr' ? 'Retour au site' : 'Back to website'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated but doesn't have the right role (compare case-insensitively)
  const userRoleLower = (user.role && String(user.role).toLowerCase()) || '';
  const hasAllowedRole = allowedRoles.some((r) => String(r).toLowerCase() === userRoleLower);
  if (!hasAllowedRole) {
    const correctHome = roleHome(user.role);
    return <Navigate to={correctHome} replace />;
  }

  // Authorized — render the layout/children
  return children ? <>{children}</> : <Outlet />;
}

export function Unauthorized() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins' }}>
          {lang === 'fr' ? 'Acces Non Autorise' : 'Unauthorized Access'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {lang === 'fr'
            ? "Vous n'avez pas les permissions necessaires pour acceder a cette page."
            : "You don't have permission to access this page."}
        </p>
        {user && (
          <a href={roleHome(user.role)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
            style={{ background: 'var(--btc-primary, #2E8B57)' }}>
            {lang === 'fr' ? 'Retour a mon tableau de bord' : 'Back to my dashboard'}
          </a>
        )}
      </div>
    </div>
  );
}