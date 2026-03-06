import { Sun, Moon, Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme, ColorMode } from '../../context/ThemeContext';

const COLOR_OPTIONS: { mode: ColorMode; label: string; color: string; color2?: string }[] = [
  { mode: 'btc',    label: 'BTC',    color: '#2E8B57', color2: '#00BCD4' },
  { mode: 'green',  label: 'Green',  color: '#16a34a' },
  { mode: 'blue',   label: 'Blue',   color: '#2563eb' },
  { mode: 'purple', label: 'Purple', color: '#7c3aed' },
  { mode: 'orange', label: 'Orange', color: '#ea580c' },
  { mode: 'rose',   label: 'Rose',   color: '#e11d48' },
];

export function ThemeControls({ iconClass = '' }: { iconClass?: string }) {
  const { theme, colorMode, toggleTheme, setColorMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-all duration-200 hover:bg-white/10 ${iconClass}`}
        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      >
        {theme === 'dark'
          ? <Sun size={18} className="text-yellow-400" />
          : <Moon size={18} />
        }
      </button>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`p-2 rounded-lg transition-all duration-200 hover:bg-white/10 ${iconClass}`}
          title="Color Theme"
        >
          <Palette size={18} />
        </button>
        {open && (
          <div className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 min-w-[170px]">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Color Theme</p>
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.mode}
                onClick={() => { setColorMode(opt.mode); setOpen(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Dual-color swatch for BTC theme, single color for others */}
                {opt.color2 ? (
                  <span
                    className="w-4 h-4 rounded-full shrink-0 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${opt.color} 50%, ${opt.color2} 50%)`,
                      outline: colorMode === opt.mode ? `2px solid ${opt.color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ) : (
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      backgroundColor: opt.color,
                      outline: colorMode === opt.mode ? `2px solid ${opt.color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                {colorMode === opt.mode && (
                  <span className="ml-auto text-xs" style={{ color: opt.color }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
