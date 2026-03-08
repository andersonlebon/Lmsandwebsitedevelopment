import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, UserCog, DollarSign, BookOpen,
  Settings, LogOut, Menu, X, GraduationCap, Bell, Search, ChevronRight,
  Building2, Award, BarChart3, ClipboardList, CalendarDays, Tag, TrendingUp
} from 'lucide-react';
import { ThemeControls } from '../components/ThemeControls';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
const btcLogo = '/images/btc-logo.png';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user: authUser, signOut } = useAuth();

  const navItems = [
    { href: '/dashboard', label: t('common.overview'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/students', label: t('common.students'), icon: Users },
    { href: '/dashboard/staff', label: t('common.staff'), icon: UserCog },
    { href: '/dashboard/departments', label: t('common.departments'), icon: Building2 },
    { href: '/dashboard/programs', label: lang === 'fr' ? 'Programmes & Frais' : 'Programs & Fees', icon: ClipboardList },
    { href: '/dashboard/promotions', label: lang === 'fr' ? 'Promotions' : 'Promotions', icon: CalendarDays },
    { href: '/dashboard/fee-structures', label: lang === 'fr' ? 'Structure des Frais' : 'Fee Structures', icon: Tag },
    { href: '/dashboard/exchange-rates', label: lang === 'fr' ? 'Taux de change' : 'Exchange Rates', icon: TrendingUp },
    { href: '/dashboard/financing', label: t('common.financing'), icon: DollarSign },
    { href: '/dashboard/certificates', label: t('common.certificatesAdmin'), icon: Award },
    { href: '/dashboard/reports', label: t('common.reports'), icon: BarChart3 },
    { href: '/dashboard/online-studies', label: t('common.onlineStudies'), icon: BookOpen },
    { href: '/dashboard/settings', label: t('common.settings'), icon: Settings },
  ];

  // Auth is now handled by ProtectedRoute — no need for manual redirect here.

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname === href;

  const user = authUser
    ? { name: authUser.name, role: 'Administrator' }
    : { name: 'Admin', role: 'Administrator' };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'bg-gray-900' : 'bg-gray-900 dark:bg-gray-950'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <Link to="/" className="flex items-center gap-2">
          <img src={btcLogo} alt="BTC" className="w-9 h-9 rounded-xl object-contain bg-white/90 p-0.5" />
          {(sidebarOpen || mobile) && (
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily: 'Poppins' }}>
                <span style={{ color: 'var(--btc-primary,#2E8B57)' }}>BTC</span>
              </div>
              <div className="text-xs text-gray-400 leading-none">{t('common.adminPanel')}</div>
            </div>
          )}
        </Link>
        {!mobile && (
          <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-white transition-colors p-1">
            {sidebarOpen ? <ChevronRight size={16} className="rotate-180" /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              style={active ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
              title={!sidebarOpen && !mobile ? item.label : undefined}
            >
              <item.icon size={19} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
              {(sidebarOpen || mobile) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-700/50">
        {(sidebarOpen || mobile) && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
              {user.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title={!sidebarOpen && !mobile ? 'Logout' : undefined}
        >
          <LogOut size={19} />
          {(sidebarOpen || mobile) && <span className="text-sm font-medium">{t('common.logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 68 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden"
      >
        <Sidebar />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative hidden sm:flex items-center">
              <Search size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-transparent focus:border-green-500 focus:outline-none w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeControls iconClass="text-gray-500 dark:text-gray-400" />
            <NotificationsDropdown />
            <Link to="/" className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors hidden sm:block">
              ← {t('common.website')}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}