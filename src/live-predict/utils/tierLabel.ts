/**
 * Maps backend tier names to Adidas Club member status labels.
 *
 * Backend tiers (unchanged): Dummies, Enthusiast, Amateur, Savvy
 * UI labels (Adidas branding): Rookie, Supporter, Athlete, Legend
 */

const TIER_TO_KEY: Record<string, string> = {
  'Dummies': 'tier.dummies',
  'Enthusiast': 'tier.enthusiast',
  'Amateur': 'tier.amateur',
  'Savvy': 'tier.savvy',
};

/**
 * Convert backend tier name to localized Adidas member status label.
 *
 * @param backendTier - Tier name from backend (e.g., "Dummies", "Savvy")
 * @param t - Translation function from useTranslation hook
 * @returns Localized tier label (e.g., "Rookie", "Legend")
 */
export function tierLabel(backendTier: string, t: any): string {
  const key = TIER_TO_KEY[backendTier];
  return key ? t(key) : backendTier;
}
