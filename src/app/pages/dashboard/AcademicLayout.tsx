import { Outlet, NavLink, Navigate, useLocation } from 'react-router';
import { Building2, ClipboardList, CalendarDays, Tag, UserCheck, BookOpen, BookMarked, Clock } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const mainTabs = [
  { to: 'departments', labelKey: 'common.departments', icon: Building2 },
  { to: 'programs', labelKey: 'common.programsAndFees', icon: ClipboardList, subPaths: ['programs', 'fee-structures', 'classes'] },
  { to: 'lessons', labelKey: 'common.lessons', icon: BookMarked },
  { to: 'promotions', labelKey: 'common.promotionsAndEnrollments', icon: CalendarDays, subPaths: ['promotions', 'enrollments'] },
  { to: 'learning', labelKey: 'common.learning', icon: BookOpen },
];

const programsAndFeesSubTabs = [
  { to: 'programs', labelKey: 'common.program' },
  { to: 'fee-structures', labelKey: 'common.fees' },
  { to: 'classes', labelKey: 'common.classes' },
];

const promotionsAndEnrollmentsSubTabs = [
  { to: 'promotions', labelKey: 'common.promotions' },
  { to: 'enrollments', labelKey: 'common.enrollments' },
];

export function AcademicLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const path = location.pathname;

  const isProgramsAndFeesActive = path.includes('/programs') || path.includes('/fee-structures') || path.includes('/classes');
  const isPromotionsAndEnrollmentsActive = path.includes('/promotions') || path.includes('/enrollments');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {mainTabs.map(({ to, labelKey, icon: Icon, subPaths }) => {
          const isActive = subPaths
            ? subPaths.some((p) => path.endsWith(p) || path.includes(`/${p}`))
            : path.endsWith(to) || path.includes(`/${to}`);
          return (
            <NavLink
              key={to}
              to={to}
              end={false}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={isActive ? { background: 'var(--btc-primary,#2E8B57)' } : undefined}
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          );
        })}
      </div>

      {/* Subtabs: Programs & Fees → Program | Fees */}
      {isProgramsAndFeesActive && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {programsAndFeesSubTabs.map(({ to, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === 'programs'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-green-600 dark:bg-green-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </div>
      )}

      {/* Subtabs: Promotions & Enrollments → Promotions | Enrollments */}
      {isPromotionsAndEnrollmentsActive && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {promotionsAndEnrollmentsSubTabs.map(({ to, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === 'promotions'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-green-600 dark:bg-green-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  );
}

export function AcademicRedirect() {
  return <Navigate to="departments" replace />;
}
