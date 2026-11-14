import React, { useState, useEffect } from 'react';
import { Sun, Moon, Type, Check } from 'lucide-react';
import { ThemeService, ThemeMode, FontSize } from '../../services/themeService';

interface ThemeAndFontControlsProps {
  variant?: 'navbar' | 'compact' | 'full';
  className?: string;
}

export const ThemeAndFontControls: React.FC<ThemeAndFontControlsProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => ThemeService.getTheme());
  const [fontSize, setFontSize] = useState<FontSize>(() => ThemeService.getFontSize());
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);

  useEffect(() => {
    const handleTheme = () => setTheme(ThemeService.getTheme());
    const handleFontSize = () => setFontSize(ThemeService.getFontSize());

    window.addEventListener('syt-theme-changed', handleTheme);
    window.addEventListener('syt-font-size-changed', handleFontSize);

    return () => {
      window.removeEventListener('syt-theme-changed', handleTheme);
      window.removeEventListener('syt-font-size-changed', handleFontSize);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    ThemeService.setTheme(nextTheme);
  };

  const handleSelectFontSize = (size: FontSize) => {
    ThemeService.setFontSize(size);
    setIsFontMenuOpen(false);
  };

  const fontLabels: Record<FontSize, { label: string; desc: string }> = {
    small: { label: 'Kichik', desc: '14px' },
    medium: { label: 'O‘rtacha', desc: '16px' },
    large: { label: 'Katta', desc: '18px' },
    xlarge: { label: 'Juda katta', desc: '20px' },
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* 46. KUNDUZGI VA TUNGI REJIM TUGMASI (Sun & Moon) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center relative group"
        title={theme === 'dark' ? 'Kunduzgi rejimga o‘tish (Light Mode)' : 'Tungi rejimga o‘tish (Dark Mode)'}
        aria-label="Rejimni almashtirish"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-blue-300 group-hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* 48. FOYDALANUVCHI UCHUN SHRIFT O‘LCHAMI (Kichik, O'rtacha, Katta, Juda katta) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
          title={`Shrift o‘lchami: ${fontLabels[fontSize].label}`}
          aria-label="Shrift o‘lchamini sozlash"
        >
          <Type className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline text-[11px] text-slate-300">
            {fontLabels[fontSize].label}
          </span>
        </button>

        {isFontMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsFontMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                Shrift o‘lchami
              </div>
              {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectFontSize(size)}
                  className={`w-full px-3 py-2 rounded-xl text-left font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    fontSize === size
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{fontLabels[size].label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({fontLabels[size].desc})
                    </span>
                  </div>
                  {fontSize === size && (
                    <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
