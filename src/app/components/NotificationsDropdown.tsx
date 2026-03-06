import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, AlertCircle, Info, BookOpen, DollarSign, Users, X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'info' | 'payment' | 'course' | 'student';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'success', title: 'Certificate Ready', message: 'Your French Language - Beginner certificate is ready to download.', time: '2 min ago', read: false },
  { id: 2, type: 'warning', title: 'Assignment Due', message: 'Essay Writing assignment is due in 2 days. Don\'t forget to submit!', time: '15 min ago', read: false },
  { id: 3, type: 'course', title: 'New Material', message: 'New course material uploaded for Computer Science module.', time: '1 hour ago', read: false },
  { id: 4, type: 'payment', title: 'Payment Received', message: 'Tuition payment of $50 has been successfully processed.', time: '3 hours ago', read: true },
  { id: 5, type: 'student', title: 'New Student', message: 'Christelle Kabila enrolled in French Language program.', time: '5 hours ago', read: true },
  { id: 6, type: 'info', title: 'System Update', message: 'BTC platform will undergo maintenance on March 8, 2026.', time: '1 day ago', read: true },
];

const typeConfig: Record<string, { icon: any; bgColor: string; iconColor: string }> = {
  success: { icon: CheckCircle, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
  warning: { icon: AlertCircle, bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
  info: { icon: Info, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  payment: { icon: DollarSign, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  course: { icon: BookOpen, bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  student: { icon: Users, bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: number) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{t('notif.title')}</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--btc-primary,#2E8B57)' }}>
                  <Check size={12} /> {t('notif.markAllRead')}
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('notif.noNotifications')}</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const config = typeConfig[notification.type] || typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                        !notification.read ? 'bg-green-50/50 dark:bg-green-900/5' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor}`}>
                        <Icon size={16} className={config.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={e => { e.stopPropagation(); removeNotification(notification.id); }}
                            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: 'var(--btc-primary,#16a34a)' }} />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
                <button className="text-xs font-medium transition-colors" style={{ color: 'var(--btc-primary,#2E8B57)' }}>
                  {t('notif.viewAll')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}