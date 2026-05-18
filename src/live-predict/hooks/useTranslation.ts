/**
 * useTranslation hook
 *
 * Reads locale from languageStore and returns a t() function
 * that resolves strings from en.ts or de.ts.
 *
 * Keys use dot notation: t('auth.login.title'), t('filterAll'), etc.
 * If a key is missing in the active locale, falls back to 'de'.
 */
import { useLanguageStore } from '../store/languageStore';
import { de } from '../i18n/de';
import { en } from '../i18n/en';

// Type helper to extract all possible dot-notation keys from a nested object
type DeepKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}` | `${K}.${DeepKeys<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = DeepKeys<typeof de>;

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function useTranslation() {
  const { locale } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    const translations = locale === 'en' ? en : de;
    const fallbackTranslations = de;

    // Try to get value from active locale
    const value = getNestedValue(translations, key);
    if (value !== undefined) {
      return value;
    }

    // Fallback to German
    const fallbackValue = getNestedValue(fallbackTranslations, key);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // If key not found in either, return the key itself (for debugging)
    return key;
  };

  return { t, locale };
}
