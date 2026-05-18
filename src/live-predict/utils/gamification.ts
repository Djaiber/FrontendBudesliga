export type Tier = 'Dummies' | 'Enthusiast' | 'Amateur' | 'Savvy';

// Dummies 0–400, Enthusiast 401–700, Amateur 701–900, Savvy 901–1200
export function getTier(exp: number): Tier {
  if (exp <= 400) return 'Dummies';
  if (exp <= 700) return 'Enthusiast';
  if (exp <= 900) return 'Amateur';
  return 'Savvy';
}

// 1 default, 1.2 at 3 correct in a row, 1.5 at 5
export function getStreakMultiplier(streak: number): 1 | 1.2 | 1.5 {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.2;
  return 1;
}