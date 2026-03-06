import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorMode = 'btc' | 'green' | 'blue' | 'purple' | 'orange' | 'rose';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  colorMode: ColorMode;
  toggleTheme: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colorMode: 'btc',
  toggleTheme: () => {},
  setColorMode: () => {},
});

// BTC theme uses the two logo colors: green (globe) + cyan (background)
// The gradient from primary → primaryDark naturally blends both colors
const COLOR_VARS: Record<ColorMode, {
  primary: string; primaryDark: string; primaryLight: string; ring: string; secondary: string;
  darkPrimary: string; darkPrimaryLight: string;
}> = {
  btc:    { primary: '#2E8B57', primaryDark: '#00ACC1', primaryLight: '#66CDAA', ring: '#80DEEA', secondary: '#00BCD4', darkPrimary: '#66CDAA', darkPrimaryLight: '#80DEEA' },
  green:  { primary: '#16a34a', primaryDark: '#15803d', primaryLight: '#4ade80', ring: '#86efac', secondary: '#16a34a', darkPrimary: '#4ade80', darkPrimaryLight: '#86efac' },
  blue:   { primary: '#2563eb', primaryDark: '#1d4ed8', primaryLight: '#60a5fa', ring: '#93c5fd', secondary: '#2563eb', darkPrimary: '#60a5fa', darkPrimaryLight: '#93c5fd' },
  purple: { primary: '#7c3aed', primaryDark: '#6d28d9', primaryLight: '#a78bfa', ring: '#c4b5fd', secondary: '#7c3aed', darkPrimary: '#a78bfa', darkPrimaryLight: '#c4b5fd' },
  orange: { primary: '#ea580c', primaryDark: '#c2410c', primaryLight: '#fb923c', ring: '#fdba74', secondary: '#ea580c', darkPrimary: '#fb923c', darkPrimaryLight: '#fdba74' },
  rose:   { primary: '#e11d48', primaryDark: '#be123c', primaryLight: '#fb7185', ring: '#fda4af', secondary: '#e11d48', darkPrimary: '#fb7185', darkPrimaryLight: '#fda4af' },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('btc_theme') as ThemeMode) || 'light';
  });
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    return (localStorage.getItem('btc_color') as ColorMode) || 'btc';
  });

  const applyTheme = (t: ThemeMode, c: ColorMode) => {
    const root = document.documentElement;
    const vars = COLOR_VARS[c];
    const isDark = t === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set BTC-specific vars
    root.style.setProperty('--btc-primary', isDark ? vars.darkPrimary : vars.primary);
    root.style.setProperty('--btc-primary-dark', vars.primaryDark);
    root.style.setProperty('--btc-primary-light', isDark ? vars.darkPrimaryLight : vars.primaryLight);
    root.style.setProperty('--btc-ring', vars.ring);
    root.style.setProperty('--btc-secondary', vars.secondary);

    // Set Tailwind/shadcn CSS vars for consistency
    root.style.setProperty('--primary', isDark ? vars.darkPrimary : vars.primary);
    root.style.setProperty('--ring', vars.ring);
  };

  useEffect(() => {
    applyTheme(theme, colorMode);
  }, [theme, colorMode]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('btc_theme', next);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem('btc_color', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorMode, toggleTheme, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);