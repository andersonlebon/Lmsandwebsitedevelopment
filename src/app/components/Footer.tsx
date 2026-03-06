import { Link } from 'react-router';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import btcLogo from 'figma:asset/a830ae5c9e57e0e708aaa9224b0dd9363e9028d9.png';

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src={btcLogo}
                alt="BTC Logo"
                className="w-12 h-12 rounded-xl object-contain bg-white/90 p-0.5"
              />
              <div>
                <div className="font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <span style={{ color: 'var(--btc-primary, #2E8B57)' }}>B</span>TC
                </div>
                <div className="text-xs text-gray-400">Brotherly Training Center</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About BTC' },
                { to: '/courses', label: 'Programs' },
                { to: '/contact', label: 'Contact' },
                { to: '/login', label: 'Student Portal' },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                    style={{ '--tw-text-opacity': '1' } as any}
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.ourPrograms')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                'English Language',
                'French Language',
                'Swahili Language',
                'Arabic Language',
                'Computer Science',
                'Accounting & Finance',
                'Business Management',
                'Graphic Design',
              ].map(p => (
                <li key={p}>
                  <span className="hover:text-green-400 transition-colors cursor-pointer">• {p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-green-400" />
                <span>Avenue des Volcans, Goma<br />Nord-Kivu, DRC (Congo)</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone size={16} className="shrink-0 text-green-400" />
                <span>+243 99 000 0000</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail size={16} className="shrink-0 text-green-400" />
                <span>info@btc-goma.cd</span>
              </li>
            </ul>

            <div className="mt-5 p-3 rounded-xl bg-gray-800 text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">{t('footer.officeHours')}</p>
              <p>Mon–Fri: 8:00 AM – 6:00 PM</p>
              <p>Sat: 9:00 AM – 1:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} BTC — Brotherly Training Center. {t('footer.rights')}
          </p>
          <p className="text-xs text-gray-500">
            Goma, Nord-Kivu, Democratic Republic of Congo
          </p>
        </div>
      </div>
    </footer>
  );
}