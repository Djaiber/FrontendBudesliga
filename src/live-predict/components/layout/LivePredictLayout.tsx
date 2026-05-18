import { Outlet } from 'react-router-dom';
import { DemomodusBanner } from '../atoms/DemomodusBanner/DemomodusBanner';
import { ConnectionStatus } from '../ui/ConnectionStatus';
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
  return (
    <div className={styles.layout}>
      <DemomodusBanner />
      <ConnectionStatus />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default LivePredictLayout;
