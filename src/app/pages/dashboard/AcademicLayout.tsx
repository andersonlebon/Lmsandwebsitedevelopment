import { Outlet, NavLink, Navigate } from 'react-router';
import { Building2, ClipboardList, CalendarDays, Tag, UserCheck, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const tabs = [
  { to: 'departments', labelKey: 'common.departments', icon: Building2 },
  { to: 'programs', labelKey: 'common.programsAndFees', icon: ClipboardList },
  { to: 'promotions', labelKey: 'common.promotions', icon: CalendarDays },
  { to: 'fee-structures', labelKey: 'common.feeStructures', icon: Tag },
  { to: 'enrollments', labelKey: 'common.enrollments', icon: UserCheck },
  { to: 'learning', labelKey: 'common.learning', icon: BookOpen },
];

export function AcademicLayout() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {tabs.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={false}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
            style={({ isActive }) => (isActive ? { background: 'var(--btc-primary,#2E8B57)' } : {})}
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

export function AcademicRedirect() {
  return <Navigate to="departments" replace />;
}
