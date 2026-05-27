import { Outlet } from 'react-router-dom';
import { DemomodusBanner } from '../atoms/DemomodusBanner/DemomodusBanner';
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './LivePredictLayout.module.css';

/**
 * LivePredictLayout
 *
 * Shell wrapper for all /live-predict routes.
 * Renders the DEMOMODUS banner at the top of the content area,
 * followed by the matched child route via <Outlet />.
 *
 * This layout renders exclusively within the main content area —
 * it does NOT render the top-bar, .main-nav, or footer.
 *
 * Validates: Requirements 2.1, 3.1
 */
export function LivePredictLayout() {
  const { t } = useTranslation();

  return (
    <div className={styles.layout}>
      {/* Adidas Club Points branding strip */}
      <div className="adidas-brand-strip">
        <img src="/assets/adidas-mark.svg" alt="Adidas" className="adidas-brand-mark" />
        <span className="adidas-brand-text">{t('brand.poweredBy')}</span>
        <span className="adidas-brand-divider">|</span>
        <span className="adidas-brand-app">{t('brand.appName')}</span>
      </div>

      <DemomodusBanner />
      <ConnectionStatus />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default LivePredictLayout;
