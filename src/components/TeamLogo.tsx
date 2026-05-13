/**
 * TeamLogo Component
 * Displays team logos with fallback to team abbreviation
 */
import styles from './TeamLogo.module.css';

interface TeamLogoProps {
  team: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const teamLogos: Record<string, string> = {
  BVB: '🟡⚫', // Borussia Dortmund - Yellow/Black
  FCB: '🔴🔵', // Bayern München - Red/Blue
  RBL: '🔴⚪', // RB Leipzig - Red/White
  WOB: '🟢⚪', // VfL Wolfsburg - Green/White
  TSG: '🔵⚪', // TSG Hoffenheim - Blue/White
  B04: '🔴⚫', // Bayer Leverkusen - Red/Black
  BMG: '⚫🟢', // Borussia Mönchengladbach - Black/Green
  VFB: '🔴⚪', // VfB Stuttgart - Red/White
  SGE: '🦅⚫', // Eintracht Frankfurt - Eagle/Black
  KAI: '🔴⚪', // Kaiserslautern - Red/White
  KOE: '🔴⚪', // 1. FC Köln - Red/White
  SVW: '🟢⚪', // Werder Bremen - Green/White
  SCF: '🔴⚫', // SC Freiburg - Red/Black
  HSV: '🔵⚪', // Hamburger SV - Blue/White
  FCK: '🔴⚪', // 1. FC Kaiserslautern - Red/White
  FCA: '🔴🟢', // FC Augsburg - Red/Green
  M05: '🔴⚪', // 1. FSV Mainz 05 - Red/White
  HON: '🔵🔴', // Heidenheim - Blue/Red
};

export default function TeamLogo({ team, size = 'medium', className = '' }: TeamLogoProps) {
  const sizeClass = styles[size];
  const logo = teamLogos[team] || '⚽';

  return (
    <div className={`${styles.teamLogo} ${sizeClass} ${className}`} title={team}>
      <span className={styles.logoIcon}>{logo}</span>
    </div>
  );
}
