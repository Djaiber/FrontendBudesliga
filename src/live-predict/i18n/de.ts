/**
 * German UI strings for the Live Predict section.
 *
 * All user-visible strings are centralised here so that adding a new locale
 * (e.g. `i18n/en.ts`) requires only creating a parallel file with the same
 * exported keys — no changes to component code are needed.
 *
 * Validates: Requirements 18.1, 18.2, 18.3
 */

export const de = {
  // ── DEMOMODUS banner ──────────────────────────────────────────────────────
  demomodusBanner: 'DEMOMODUS – Keine echten Einsätze',

  // ── Navigation ────────────────────────────────────────────────────────────
  navLinkText: 'Live Predict',

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyStateNoMatches: 'Keine Live-Spiele verfügbar',
  emptyStateNoBets: 'Noch keine Wetten in diesem Spiel',

  // ── Bet Slip ──────────────────────────────────────────────────────────────
  betSlipConfirm: 'Wette bestätigen',
  betSlipCancel: 'Abbrechen',
  betSlipStakeLabel: 'Einsatz',
  betSlipPayoutLabel: 'Mögliche Auszahlung',
  betSlipErrorGeneric: 'Fehler beim Platzieren der Wette',

  // ── Error messages ────────────────────────────────────────────────────────
  connectionError: 'Verbindung unterbrochen – bitte Seite neu laden',
  marketExpired: 'Markt abgelaufen – Wette nicht platziert',

  // ── Bet / market status labels ────────────────────────────────────────────
  statusPending: 'ausstehend',
  statusWon: 'gewonnen',
  statusLost: 'verloren',
  statusCancelled: 'storniert',

  // ── Filter pill labels ────────────────────────────────────────────────────
  filterAll: 'Alle',
  filterGoal: 'Tor',
  filterShot: 'Torschuss',
  filterCorner: 'Ecke',
  filterFreeKick: 'Freistoß',
  filterSprint: 'Sprint',

  // ── History table column headers ──────────────────────────────────────────
  historyColDate: 'Datum',
  historyColMatch: 'Spiel',
  historyColMarket: 'Markt',
  historyColOutcome: 'Gewähltes Ergebnis',
  historyColStake: 'Einsatz',
  historyColOdds: 'Quote',
  historyColStatus: 'Status',
  historyColReturn: 'Rückgabe',

  // ── History summary figures ───────────────────────────────────────────────
  historyTotalWagered: 'Gesamt eingesetzt',
  historyTotalWon: 'Gesamt gewonnen',
  historyNetPnL: 'Netto P&L',
  historyHitRate: 'Trefferquote',

  // ── Metrics bar labels ────────────────────────────────────────────────────
  metricsBarPossession: 'Ballbesitz',
  metricsBarXG: 'xG',
  metricsBarShots: 'Schüsse',
  metricsBarSprints: 'Sprints',

  // ── Live / loading indicators ─────────────────────────────────────────────
  liveLabel: 'LIVE',
  loadingSpinner: 'Laden...',

  // ── Match list ────────────────────────────────────────────────────────────
  nextScheduledMatches: 'Nächste geplante Spiele',

  // ── Connection status ─────────────────────────────────────────────────────
  connectionStatusConnecting: 'Verbinde...',
  connectionStatusConnected: 'Verbunden',
  connectionStatusDisconnected: 'Getrennt',
} as const;

/**
 * Type alias for the German strings object.
 * Components can import this type for prop typing, e.g.:
 *
 * ```ts
 * import type { I18nDe } from '../i18n/de';
 * interface Props { t: I18nDe }
 * ```
 */
export type I18nDe = typeof de;
