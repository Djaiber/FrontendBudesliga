import { useMatch } from 'react-router-dom';
import { LivePill } from '../LivePill/LivePill';
import { de } from '../../../i18n/de';
import styles from './NavLivePredictLink.module.css';

/**
 * NavLivePredictLink
 *
 * A single nav link for the Live Predict section, inserted immediately after
 * the "Liveticker" link in the existing .main-nav bar.
 *
 * - Uses the same visual style as other .nav-link items:
 *   Roboto Condensed 13px, font-weight 700, uppercase, letter-spacing 0.5px.
 * - When the current route starts with /live-predict, applies a 3px
 *   var(--red) underline via aria-current + CSS Module.
 * - When the current route starts with /live-predict, renders a LivePill
 *   to the right of the link text.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export function NavLivePredictLink() {
  // useMatch with /* suffix matches /live-predict and all sub-routes
  const isActive = useMatch('/live-predict/*') !== null;

  return (
    <a
      href="/live-predict"
      className={`nav-link ${styles.navLink}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {de.navLinkText}
      {isActive && <LivePill />}
    </a>
  );
}

export default NavLivePredictLink;
