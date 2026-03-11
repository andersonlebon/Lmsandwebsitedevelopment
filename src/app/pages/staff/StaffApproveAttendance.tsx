import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export function StaffApproveAttendance() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || searchParams.get('request_id');
  const studentId = searchParams.get('studentId') || searchParams.get('student_id');
  const didApprove = useRef(false);
  const [status, setStatus] = useState<'idle' | 'approving' | 'approved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!requestId || didApprove.current) return;
    didApprove.current = true;
    setStatus('approving');
    apiFetch(`/attendance-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      requireAuth: true,
    })
      .then(() => setStatus('approved'))
      .catch((e: Error) => {
        setStatus('error');
        setErrorMessage(e.message || 'Failed to approve');
      });
  }, [requestId]);

  if (!requestId) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {lang === 'fr' ? 'Lien invalide : paramètre requestId manquant.' : 'Invalid link: missing requestId parameter.'}
        </p>
        <Link to="/staff/attendance-requests" className="inline-block mt-4 text-sm font-medium" style={{ color: 'var(--btc-primary,#16a34a)' }}>
          {lang === 'fr' ? 'Retour aux demandes' : 'Back to attendance requests'}
        </Link>
      </div>
    );
  }

  if (status === 'approving') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
        <Loader2 size={40} className="animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Approbation en cours…' : 'Approving…'}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
        <Link to="/staff/attendance-requests" className="inline-block text-sm font-medium" style={{ color: 'var(--btc-primary,#16a34a)' }}>
          {lang === 'fr' ? 'Retour aux demandes' : 'Back to attendance requests'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
      <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Poppins' }}>
        {lang === 'fr' ? 'Présence approuvée' : 'Attendance approved'}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {studentId
          ? (lang === 'fr' ? 'Demande pour l\'étudiant approuvée.' : 'Request for student approved.')
          : (lang === 'fr' ? 'La demande de présence a été approuvée.' : 'The attendance request has been approved.')}
      </p>
      <Link
        to="/staff/attendance-requests"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
        style={{ background: 'var(--btc-primary,#16a34a)' }}
      >
        {lang === 'fr' ? 'Voir les demandes' : 'View attendance requests'}
      </Link>
    </div>
  );
}
