import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { ThemeControls } from './ThemeControls';
import { useLanguage } from '../../context/LanguageContext';
import btcLogo from 'figma:asset/a830ae5c9e57e0e708aaa9224b0dd9363e9028d9.png';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/courses', label: t('nav.programs') },
    { href: '/register', label: t('common.register') },
    { href: '/contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-100 dark:border-gray-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={btcLogo}
              alt="BTC Logo"
              className="w-11 h-11 rounded-xl object-contain shadow-md transition-transform group-hover:scale-110 bg-white/90 backdrop-blur-sm p-0.5"
            />
            <div>
              <div className="font-bold text-gray-900 dark:text-white leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: 'var(--btc-primary, #2E8B57)' }}>B</span>
                <span className={scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}>TC</span>
              </div>
              <div className={`text-xs leading-none hidden sm:block ${scrolled ? 'text-gray-500 dark:text-gray-400' : 'text-white/70'}`}>
                Brotherly Training Center
              </div>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-white shadow-md'
                    : scrolled
                      ? 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                style={isActive(link.href) ? { background: 'var(--btc-primary, #2E8B57)' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeControls iconClass={scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'} />
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 border ${
                scrolled
                  ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'border-white/20 text-white/90 hover:bg-white/10'
              }`}
              title={lang === 'en' ? 'Switch to French' : 'Switch to English'}
            >
              {lang === 'en' ? 'FR' : 'EN'}
            </button>
            <Link
              to="/portal"
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:opacity-90"
              style={{
                color: scrolled ? 'var(--btc-primary, #2E8B57)' : 'white',
                borderColor: scrolled ? 'var(--btc-primary, #2E8B57)' : 'rgba(255,255,255,0.3)',
                background: scrolled ? 'transparent' : 'rgba(255,255,255,0.1)',
              }}
            >
              {t('nav.studentPortal')}
            </Link>
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: 'var(--btc-primary, #2E8B57)' }}
            >
              {t('nav.dashboard')}
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile language switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold tracking-wide transition-all border ${
                scrolled
                  ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  : 'border-white/20 text-white/90'
              }`}
            >
              {lang === 'en' ? 'FR' : 'EN'}
            </button>
            <ThemeControls iconClass={scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'} />
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white hover:bg-white/10'}`}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  style={isActive(link.href) ? { background: 'var(--btc-primary, #2E8B57)' } : {}}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/portal"
                className="mt-1 px-4 py-3 rounded-xl text-sm font-medium text-center border transition-colors"
                style={{ color: 'var(--btc-primary, #2E8B57)', borderColor: 'var(--btc-primary, #2E8B57)' }}
              >
                {t('nav.studentPortal')}
              </Link>
              <Link
                to="/login"
                className="mt-1 px-4 py-3 rounded-xl text-white text-sm font-semibold text-center shadow-md"
                style={{ background: 'var(--btc-primary, #2E8B57)' }}
              >
                {t('nav.adminDashboard')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}