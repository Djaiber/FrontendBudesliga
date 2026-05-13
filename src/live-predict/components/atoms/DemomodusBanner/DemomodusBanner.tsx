import { de } from '../../../i18n/de';
import styles from './DemomodusBanner.module.css';

/**
 * DemomodusBanner
 *
 * Always-visible banner indicating the feature is running in demo mode.
 * Not dismissible. Renders the string from `de.demomodusBanner`.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
export function DemomodusBanner() {
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      {de.demomodusBanner}
    </div>
  );
}

export default DemomodusBanner;
