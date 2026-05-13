/**
 * Team Icons - SVG-based team logos
 * Bundesliga team crests
 */

interface IconProps {
  size?: number;
  className?: string;
}

// Borussia Dortmund (BVB) - Yellow and Black
export function BVBIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#FDE100" stroke="#000" strokeWidth="2"/>
      <text x="50" y="40" fontSize="32" fontWeight="bold" textAnchor="middle" fill="#000">BVB</text>
      <text x="50" y="70" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#000">09</text>
    </svg>
  );
}

// Bayern München (FCB) - Red and Blue
export function FCBIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#DC052D" stroke="#0066B2" strokeWidth="3"/>
      <circle cx="50" cy="50" r="35" fill="#0066B2"/>
      <path d="M 30 40 L 50 25 L 70 40 L 65 60 L 50 70 L 35 60 Z" fill="#FFF"/>
      <text x="50" y="95" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#DC052D">FCB</text>
    </svg>
  );
}

// RB Leipzig (RBL) - Red and White
export function RBLIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#DD0741" stroke="#FFF" strokeWidth="2"/>
      <text x="50" y="45" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#FFF">RB</text>
      <text x="50" y="70" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#FFF">Leipzig</text>
    </svg>
  );
}

// VfL Wolfsburg (WOB) - Green and White
export function WOBIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#65B32E" stroke="#FFF" strokeWidth="2"/>
      <text x="50" y="45" fontSize="26" fontWeight="bold" textAnchor="middle" fill="#FFF">VfL</text>
      <text x="50" y="70" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#FFF">Wolfsburg</text>
    </svg>
  );
}

// TSG Hoffenheim (TSG) - Blue and White
export function TSGIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#1961B5" stroke="#FFF" strokeWidth="2"/>
      <text x="50" y="55" fontSize="30" fontWeight="bold" textAnchor="middle" fill="#FFF">TSG</text>
    </svg>
  );
}

// Bayer Leverkusen (B04) - Red and Black
export function B04Icon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#E32221" stroke="#000" strokeWidth="2"/>
      <text x="50" y="45" fontSize="26" fontWeight="bold" textAnchor="middle" fill="#FFF">B04</text>
      <text x="50" y="70" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#FFF">Leverkusen</text>
    </svg>
  );
}

// Borussia Mönchengladbach (BMG) - Black and Green
export function BMGIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#000" stroke="#00A650" strokeWidth="3"/>
      <text x="50" y="55" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#FFF">BMG</text>
    </svg>
  );
}

// VfB Stuttgart (VFB) - Red and White
export function VFBIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#FFF" stroke="#E32219" strokeWidth="3"/>
      <text x="50" y="45" fontSize="26" fontWeight="bold" textAnchor="middle" fill="#E32219">VfB</text>
      <text x="50" y="70" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#E32219">Stuttgart</text>
    </svg>
  );
}

// Eintracht Frankfurt (SGE) - Red, Black and White
export function SGEIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#E1000F" stroke="#000" strokeWidth="2"/>
      <path d="M 50 30 L 60 45 L 75 45 L 62 55 L 67 70 L 50 60 L 33 70 L 38 55 L 25 45 L 40 45 Z" fill="#FFF"/>
      <text x="50" y="95" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000">SGE</text>
    </svg>
  );
}

// Generic team icon for teams without specific logos
export function GenericTeamIcon({ size = 40, className = '', team = '' }: IconProps & { team?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="#2a2a2a" stroke="#555" strokeWidth="2"/>
      <text x="50" y="60" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#FFF">{team}</text>
    </svg>
  );
}

// Export all icons as a map
export const TeamIconsMap = {
  BVB: BVBIcon,
  FCB: FCBIcon,
  RBL: RBLIcon,
  WOB: WOBIcon,
  TSG: TSGIcon,
  B04: B04Icon,
  BMG: BMGIcon,
  VFB: VFBIcon,
  SGE: SGEIcon,
};
