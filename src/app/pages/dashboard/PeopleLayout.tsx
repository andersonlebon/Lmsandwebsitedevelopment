import { Outlet, NavLink, Navigate } from 'react-router';
import { Users, UserCog } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const tabs = [
  { to: 'students', labelKey: 'common.students', icon: Users },
  { to: 'staff', labelKey: 'common.staff', icon: UserCog },
];

export function PeopleLayout() {
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

export function PeopleRedirect() {
  return <Navigate to="students" replace />;
}
