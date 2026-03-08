import { Link, useLocation } from 'react-router';

interface Crumb {
  label: string;
  href?: string;
}

const DASHBOARD_CRUMBS: Record<string, Crumb[]> = {
  '': [{ label: 'Overview', href: '/dashboard' }],
  'people': [{ label: 'People', href: '/dashboard/people/students' }, { label: 'Students' }, { label: 'Staff' }],
  'people/students': [{ label: 'People', href: '/dashboard/people/students' }, { label: 'Students' }],
  'people/staff': [{ label: 'People', href: '/dashboard/people/staff' }, { label: 'Staff' }],
  'academic': [{ label: 'Academic', href: '/dashboard/academic/departments' }, { label: 'Departments' }],
  'academic/departments': [{ label: 'Academic', href: '/dashboard/academic/departments' }, { label: 'Departments' }],
  'academic/programs': [{ label: 'Academic', href: '/dashboard/academic/programs' }, { label: 'Programs & Fees' }],
  'academic/promotions': [{ label: 'Academic', href: '/dashboard/academic/promotions' }, { label: 'Promotions' }],
  'academic/fee-structures': [{ label: 'Academic', href: '/dashboard/academic/fee-structures' }, { label: 'Fee Structures' }],
  'academic/enrollments': [{ label: 'Academic', href: '/dashboard/academic/enrollments' }, { label: 'Enrollments' }],
  'academic/learning': [{ label: 'Academic', href: '/dashboard/academic/learning' }, { label: 'Exercises & Assessments' }],
  'finance': [{ label: 'Finance', href: '/dashboard/finance/exchange-rates' }, { label: 'Exchange Rates' }],
  'finance/exchange-rates': [{ label: 'Finance', href: '/dashboard/finance/exchange-rates' }, { label: 'Exchange Rates' }],
  'finance/financing': [{ label: 'Finance', href: '/dashboard/finance/financing' }, { label: 'Financing' }],
  'reports-certificates': [{ label: 'Reports & Certificates', href: '/dashboard/reports-certificates/reports' }, { label: 'Reports' }],
  'reports-certificates/reports': [{ label: 'Reports & Certificates', href: '/dashboard/reports-certificates/reports' }, { label: 'Reports' }],
  'reports-certificates/certificates': [{ label: 'Reports & Certificates', href: '/dashboard/reports-certificates/certificates' }, { label: 'Certificates' }],
  'online-studies': [{ label: 'Online Studies', href: '/dashboard/online-studies' }],
  'settings': [{ label: 'Settings', href: '/dashboard/settings' }],
};

const PORTAL_CRUMBS: Record<string, Crumb[]> = {
  '': [{ label: 'Dashboard', href: '/portal' }],
  'courses': [{ label: 'My Courses', href: '/portal/courses' }],
  'records': [{ label: 'My Records', href: '/portal/records/student-id' }, { label: 'Student ID' }],
  'records/student-id': [{ label: 'My Records', href: '/portal/records/student-id' }, { label: 'Student ID' }],
  'records/attendance': [{ label: 'My Records', href: '/portal/records/attendance' }, { label: 'Attendance' }],
  'records/certificates': [{ label: 'My Records', href: '/portal/records/certificates' }, { label: 'Certificates' }],
  'payments': [{ label: 'My Payments', href: '/portal/payments' }],
  'connect': [{ label: 'Connect', href: '/portal/connect/jobs' }, { label: 'Job Board' }],
  'connect/jobs': [{ label: 'Connect', href: '/portal/connect/jobs' }, { label: 'Job Board' }],
  'connect/ai-assistant': [{ label: 'Connect', href: '/portal/connect/ai-assistant' }, { label: 'AI Assistant' }],
  'connect/calendar': [{ label: 'Connect', href: '/portal/connect/calendar' }, { label: 'Calendar' }],
  'connect/community': [{ label: 'Connect', href: '/portal/connect/community' }, { label: 'Community' }],
};

export function Breadcrumbs({ base = 'dashboard' }: { base?: 'dashboard' | 'portal' }) {
  const location = useLocation();
  const path = location.pathname;
  const prefix = base === 'dashboard' ? '/dashboard/' : '/portal/';
  const relative = path.startsWith(prefix) ? path.slice(prefix.length).replace(/\/$/, '') : '';
  const map = base === 'dashboard' ? DASHBOARD_CRUMBS : PORTAL_CRUMBS;
  let crumbs = map[relative];
  if (!crumbs) {
    const parts = relative.split('/');
    const key = parts.slice(0, 2).join('/') || parts[0] || '';
    crumbs = map[key] || [{ label: parts[parts.length - 1] || 'Page' }];
  }
  if (crumbs.length === 0) return null;
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
          {c.href ? (
            <Link to={c.href} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">{c.label}</Link>
          ) : (
            <span className="text-gray-700 dark:text-gray-200 font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
