/**
 * English UI strings for the Live Predict section.
 *
 * Parallel structure to de.ts — all keys must match exactly.
 */

export const en = {
  // ── Auth pages ────────────────────────────────────────────────────────────
  auth: {
    login: {
      title: 'Sign In',
      subtitle: 'Sign in to use Live Predict.',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      submitButton: 'Sign In',
      submitButtonLoading: 'Signing in…',
      noAccountYet: 'No account yet?',
      registerLink: 'Register now',
    },
    register: {
      title: 'Register',
      subtitle: 'Create your account for Bundesliga Live Predict.',
      nameLabel: 'Name',
      namePlaceholder: 'Your full name',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Repeat password',
      submitButton: 'Create Account',
      submitButtonLoading: 'Registering…',
      alreadyRegistered: 'Already registered?',
      loginLink: 'Sign in now',
      errorNameRequired: 'Please enter your name.',
      errorPasswordMismatch: 'Passwords do not match.',
      errorPasswordTooShort: 'Password must be at least 8 characters long.',
    },
    confirm: {
      title: 'Confirm Account',
      subtitle: 'We have sent a 6-digit confirmation code to your email address. Please enter the code below to activate your account.',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      codeLabel: 'Confirmation Code',
      codePlaceholder: '000000',
      infoText: 'No code received? Check your spam folder or',
      infoTextBold: 'request a new code',
      submitButton: 'Confirm Account',
      submitButtonLoading: 'Confirming…',
      successWithAutoLogin: 'Your account has been successfully confirmed. Signing you in…',
      successWithoutAutoLogin: 'Your account has been successfully confirmed. You can now sign in.',
      backToLogin: 'Back to',
      loginLink: 'Sign In',
    },
    errors: {
      loginFailed: 'Sign in failed.',
      registerFailed: 'Registration failed.',
      confirmFailed: 'Invalid or expired code. Please try again.',
      confirmOrLoginFailed: 'Confirmation or sign in failed.',
    },
  },

  // ── DEMOMODUS banner ──────────────────────────────────────────────────────
  demomodusBanner: 'DEMO MODE – No real stakes',

  // ── Navigation ────────────────────────────────────────────────────────────
  navLinkText: 'Live Predict',

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyStateNoMatches: 'No live matches available',
  emptyStateNoBets: 'No bets in this match yet',

  // ── Bet Slip ──────────────────────────────────────────────────────────────
  betSlipConfirm: 'Confirm Bet',
  betSlipCancel: 'Cancel',
  betSlipStakeLabel: 'Stake',
  betSlipPayoutLabel: 'Potential Payout',
  betSlipErrorGeneric: 'Error placing bet',

  // ── Error messages ────────────────────────────────────────────────────────
  connectionError: 'Connection lost – please reload page',
  marketExpired: 'Market expired – bet not placed',

  // ── Bet / market status labels ────────────────────────────────────────────
  statusPending: 'pending',
  statusWon: 'won',
  statusLost: 'lost',
  statusCancelled: 'cancelled',

  // ── Filter pill labels ────────────────────────────────────────────────────
  filterAll: 'All',
  filterGoal: 'Goal',
  filterShot: 'Shot',
  filterCorner: 'Corner',
  filterFreeKick: 'Free Kick',
  filterSprint: 'Sprint',

  // ── History table column headers ──────────────────────────────────────────
  historyColDate: 'Date',
  historyColMatch: 'Match',
  historyColMarket: 'Market',
  historyColOutcome: 'Selected Outcome',
  historyColStake: 'Stake',
  historyColOdds: 'Odds',
  historyColStatus: 'Status',
  historyColReturn: 'Return',

  // ── History summary figures ───────────────────────────────────────────────
  historyTotalWagered: 'Total Wagered',
  historyTotalWon: 'Total Won',
  historyNetPnL: 'Net P&L',
  historyHitRate: 'Hit Rate',

  // ── Metrics bar labels ────────────────────────────────────────────────────
  metricsBarPossession: 'Possession',
  metricsBarXG: 'xG',
  metricsBarShots: 'Shots',
  metricsBarSprints: 'Sprints',

  // ── Live / loading indicators ─────────────────────────────────────────────
  liveLabel: 'LIVE',
  loadingSpinner: 'Loading...',

  // ── Match list ────────────────────────────────────────────────────────────
  nextScheduledMatches: 'Next Scheduled Matches',

  // ── Connection status ─────────────────────────────────────────────────────
  connectionStatusConnecting: 'Connecting...',
  connectionStatusConnected: 'Connected',
  connectionStatusDisconnected: 'Disconnected',
} as const;

export type I18nEn = typeof en;
