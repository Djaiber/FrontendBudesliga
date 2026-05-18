/**
 * Language store — Zustand slice for locale management.
 *
 * Persists the selected language in localStorage under 'bl-locale'.
 * Defaults to 'de' (German) if no value is stored.
 */
import { create } from 'zustand';

export type Locale = 'en' | 'de';

interface LanguageState {
  locale: Locale;
}

interface LanguageActions {
  setLocale: (locale: Locale) => void;
}

// Read initial locale from localStorage, default to 'de'
const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'de';
  
  const stored = localStorage.getItem('bl-locale');
  if (stored === 'en' || stored === 'de') {
    return stored;
  }
  return 'de';
};

export const useLanguageStore = create<LanguageState & LanguageActions>((set) => ({
  locale: getInitialLocale(),

  setLocale: (locale: Locale) => {
    localStorage.setItem('bl-locale', locale);
    set({ locale });
  },
}));
