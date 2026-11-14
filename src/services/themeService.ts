export type ThemeMode = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

const THEME_STORAGE_KEY = 'syt_theme_mode';
const FONT_SIZE_STORAGE_KEY = 'syt_font_size';

export class ThemeService {
  static getTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  }

  static setTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
    this.applyTheme(theme);
    window.dispatchEvent(new CustomEvent('syt-theme-changed', { detail: { theme } }));
  }

  static applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  static getFontSize(): FontSize {
    try {
      const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY) as FontSize | null;
      if (stored && ['small', 'medium', 'large', 'xlarge'].includes(stored)) {
        return stored;
      }
    } catch {
      // fallback
    }
    return 'medium';
  }

  static setFontSize(size: FontSize): void {
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
    } catch (e) {
      console.warn('Failed to save font size preference', e);
    }
    this.applyFontSize(size);
    window.dispatchEvent(new CustomEvent('syt-font-size-changed', { detail: { size } }));
  }

  static applyFontSize(size: FontSize): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-font-size', size);

    // Apply baseline font size in px so standard rem calculations scale smoothly
    switch (size) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      case 'xlarge':
        root.style.fontSize = '20px';
        break;
      default:
        root.style.fontSize = '16px';
    }
  }

  static init(): void {
    this.applyTheme(this.getTheme());
    this.applyFontSize(this.getFontSize());
  }
}
