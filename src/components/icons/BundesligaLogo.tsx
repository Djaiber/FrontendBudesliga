/**
 * Bundesliga Logo Component
 * Official Bundesliga logo with player silhouette
 */

interface BundesligaLogoProps {
  size?: number;
  className?: string;
}

export function BundesligaLogo({ size = 32, className = '' }: BundesligaLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      aria-label="Bundesliga"
    >
      {/* Red background */}
      <rect width="100" height="100" fill="#D2001F" />
      
      {/* Player silhouette kicking ball */}
      <g fill="#FFFFFF">
        {/* Ball */}
        <circle cx="75" cy="35" r="8" />
        
        {/* Player body */}
        <path d="M 25 20 Q 30 18 32 22 Q 34 26 32 30 Q 30 34 25 32 Q 20 30 20 25 Q 20 20 25 20 Z" />
        
        {/* Torso and arms */}
        <path d="M 27 32 L 30 45 L 35 42 L 32 50 L 28 52 L 24 50 L 20 42 L 25 45 Z" />
        
        {/* Kicking leg */}
        <path d="M 28 52 L 32 60 L 40 58 L 50 52 L 60 48 L 68 42 L 70 38 L 65 40 L 55 46 L 45 52 L 35 56 L 30 58 Z" />
        
        {/* Standing leg */}
        <path d="M 24 52 L 22 65 L 20 78 L 18 85 L 22 85 L 24 78 L 26 65 Z" />
        
        {/* Foot */}
        <ellipse cx="20" cy="87" rx="4" ry="2" />
      </g>
    </svg>
  );
}

export default BundesligaLogo;
