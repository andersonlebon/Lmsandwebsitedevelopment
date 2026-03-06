import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Palette, Save, CheckCircle, Sun, Moon, School } from 'lucide-react';
import { useTheme, ColorMode } from '../../../context/ThemeContext';

const COLOR_OPTIONS: { mode: ColorMode; label: string; hex: string; emoji: string }[] = [
  { mode: 'green', label: 'Forest Green', hex: '#16a34a', emoji: '🌿' },
  { mode: 'blue', label: 'Ocean Blue', hex: '#2563eb', emoji: '🌊' },
  { mode: 'purple', label: 'Royal Purple', hex: '#7c3aed', emoji: '💜' },
  { mode: 'orange', label: 'Sunset Orange', hex: '#ea580c', emoji: '🌅' },
  { mode: 'rose', label: 'Rose Red', hex: '#e11d48', emoji: '🌹' },
];

export function Settings() {
  const { theme, colorMode, toggleTheme, setColorMode } = useTheme();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'school' | 'security'>('appearance');

  const user = JSON.parse(localStorage.getItem('btc_user') || '{"name":"Admin","role":"Administrator","email":"admin@btc-goma.cd"}');
  const [profile, setProfile] = useState({ name: user.name || '', email: user.email || '', role: user.role || '', phone: '+243 99 000 0000' });
  const [notifications, setNotifications] = useState({ newStudents: true, payments: true, staffUpdates: false, reports: true, system: true });
  const [schoolInfo, setSchoolInfo] = useState({ name: 'BTC — Brotherly Training Center', tagline: 'École de Langues et Métiers', address: 'Avenue des Volcans, Goma, Nord-Kivu, DRC', phone: '+243 99 000 0000', email: 'info@btc-goma.cd', website: 'www.btc-goma.cd', founded: '2014' });

  const handleSave = () => {
    localStorage.setItem('btc_user', JSON.stringify({ ...user, name: profile.name, email: profile.email, role: profile.role }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'school', label: 'School Info', icon: School },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                  activeTab === tab.key ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={activeTab === tab.key ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Appearance</h3>

                {/* Theme mode */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => theme === 'dark' && toggleTheme()}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Sun size={18} className="text-yellow-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Light</p>
                        <p className="text-xs text-gray-500">Bright & clean</p>
                      </div>
                      {theme === 'light' && <CheckCircle size={16} className="ml-auto" style={{ color: 'var(--btc-primary,#16a34a)' }} />}
                    </button>
                    <button onClick={() => theme === 'light' && toggleTheme()}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                        <Moon size={18} className="text-yellow-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dark</p>
                        <p className="text-xs text-gray-500">Easy on eyes</p>
                      </div>
                      {theme === 'dark' && <CheckCircle size={16} className="ml-auto" style={{ color: 'var(--btc-primary,#16a34a)' }} />}
                    </button>
                  </div>
                </div>

                {/* Color mode */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accent Color</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COLOR_OPTIONS.map(opt => (
                      <button key={opt.mode} onClick={() => setColorMode(opt.mode)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${colorMode === opt.mode ? 'border-current' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                        style={colorMode === opt.mode ? { borderColor: opt.hex, background: `${opt.hex}10` } : {}}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md" style={{ background: opt.hex }}>
                          {opt.emoji}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{opt.label}</p>
                          <p className="text-xs font-mono text-gray-500">{opt.hex}</p>
                        </div>
                        {colorMode === opt.mode && <CheckCircle size={16} style={{ color: opt.hex }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: 'var(--btc-primary,#16a34a)' }}>Primary Button</button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium border-2" style={{ color: 'var(--btc-primary,#16a34a)', borderColor: 'var(--btc-primary,#16a34a)' }}>Outlined</button>
                    <span className="px-3 py-1.5 rounded-full text-white text-xs font-medium" style={{ background: 'var(--btc-primary-light,#4ade80)', color: 'var(--btc-primary-dark,#15803d)' }}>Badge</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Profile Settings</h3>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    {profile.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{profile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
                  </div>
                </div>
                {[['Full Name', 'name', 'text'], ['Email', 'email', 'email'], ['Role', 'role', 'text'], ['Phone', 'phone', 'tel']].map(([lbl, key, type]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lbl}</label>
                    <input type={type} value={(profile as any)[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'school' && (
              <div className="space-y-4">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>School Information</h3>
                {[
                  ['School Name', 'name'], ['Tagline/Subtitle', 'tagline'], ['Address', 'address'],
                  ['Phone', 'phone'], ['Email', 'email'], ['Website', 'website'], ['Year Founded', 'founded']
                ].map(([lbl, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{lbl}</label>
                    <input value={(schoolInfo as any)[key]} onChange={e => setSchoolInfo(s => ({ ...s, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { key: 'newStudents', label: 'New Student Enrollments', desc: 'Get notified when a new student registers' },
                    { key: 'payments', label: 'Payment Alerts', desc: 'Notifications for payments and overdue fees' },
                    { key: 'staffUpdates', label: 'Staff Updates', desc: 'When staff records are modified' },
                    { key: 'reports', label: 'Monthly Reports', desc: 'Automated monthly summary reports' },
                    { key: 'system', label: 'System Alerts', desc: 'Important system and security notifications' },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{n.desc}</p>
                      </div>
                      <button onClick={() => setNotifications(ns => ({ ...ns, [n.key]: !ns[n.key as keyof typeof ns] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${(notifications as any)[n.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(notifications as any)[n.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>Security</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm mb-1">
                      <Shield size={16} /> Account Secured
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500">Your account is active and secure.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
              <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all"
                style={{ background: 'var(--btc-primary,#16a34a)' }}>
                <Save size={16} /> Save Changes
              </button>
              {saved && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle size={15} /> Saved successfully!
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
