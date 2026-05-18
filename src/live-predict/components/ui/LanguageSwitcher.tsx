/**
 * LanguageSwitcher
 *
 * Renders two buttons: "EN" and "DE"
 * Active language button has a red underline using var(--red, #d2001f)
 * Inactive button uses var(--text-muted, #888)
 */
import { useLanguageStore, type Locale } from '../../store/languageStore';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <div className={styles.switcher}>
      <button
        type="button"
        className={`${styles.button} ${locale === 'de' ? styles.active : ''}`}
        onClick={() => handleLocaleChange('de')}
        aria-label="Deutsch"
        aria-current={locale === 'de' ? 'true' : undefined}
      >
        DE
      </button>
      <span className={styles.separator}>|</span>
      <button
        type="button"
        className={`${styles.button} ${locale === 'en' ? styles.active : ''}`}
        onClick={() => handleLocaleChange('en')}
        aria-label="English"
        aria-current={locale === 'en' ? 'true' : undefined}
      >
        EN
      </button>
    </div>
  );
}
