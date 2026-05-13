/**
 * TeamLogo Component
 * Displays team logos using SVG icons
 */
import styles from './TeamLogo.module.css';
import { TeamIconsMap, GenericTeamIcon } from './icons/TeamIcons';

interface TeamLogoProps {
  team: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeMap = {
  small: 28,
  medium: 40,
  large: 64,
};

export default function TeamLogo({ team, size = 'medium', className = '' }: TeamLogoProps) {
  const sizeClass = styles[size];
  const iconSize = sizeMap[size];
  
  // Get the appropriate icon component
  const IconComponent = TeamIconsMap[team as keyof typeof TeamIconsMap];
  
  return (
    <div className={`${styles.teamLogo} ${sizeClass} ${className}`} title={team}>
      {IconComponent ? (
        <IconComponent size={iconSize} />
      ) : (
        <GenericTeamIcon size={iconSize} team={team} />
      )}
    </div>
  );
}
