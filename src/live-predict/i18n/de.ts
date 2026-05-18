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
  // ── Auth pages ────────────────────────────────────────────────────────────
  auth: {
    login: {
      title: 'Anmelden',
      subtitle: 'Melde dich an, um Live Predict zu nutzen.',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'deine@email.de',
      passwordLabel: 'Passwort',
      passwordPlaceholder: '••••••••',
      submitButton: 'Anmelden',
      submitButtonLoading: 'Wird angemeldet…',
      noAccountYet: 'Noch kein Konto?',
      registerLink: 'Jetzt registrieren',
    },
    register: {
      title: 'Registrieren',
      subtitle: 'Erstelle dein Konto für Bundesliga Live Predict.',
      nameLabel: 'Name',
      namePlaceholder: 'Dein vollständiger Name',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'deine@email.de',
      passwordLabel: 'Passwort',
      passwordPlaceholder: 'Mindestens 8 Zeichen',
      confirmPasswordLabel: 'Passwort bestätigen',
      confirmPasswordPlaceholder: 'Passwort wiederholen',
      submitButton: 'Konto erstellen',
      submitButtonLoading: 'Wird registriert…',
      alreadyRegistered: 'Bereits registriert?',
      loginLink: 'Jetzt anmelden',
      errorNameRequired: 'Bitte gib deinen Namen ein.',
      errorPasswordMismatch: 'Die Passwörter stimmen nicht überein.',
      errorPasswordTooShort: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    },
    confirm: {
      title: 'Konto bestätigen',
      subtitle: 'Wir haben dir einen 6-stelligen Bestätigungscode an deine E-Mail-Adresse gesendet. Bitte gib den Code unten ein, um dein Konto zu aktivieren.',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'deine@email.de',
      passwordLabel: 'Passwort',
      passwordPlaceholder: '••••••••',
      codeLabel: 'Bestätigungscode',
      codePlaceholder: '000000',
      infoText: 'Kein Code erhalten? Überprüfe deinen Spam-Ordner oder',
      infoTextBold: 'fordere einen neuen Code an',
      submitButton: 'Konto bestätigen',
      submitButtonLoading: 'Wird bestätigt…',
      successWithAutoLogin: 'Dein Konto wurde erfolgreich bestätigt. Du wirst angemeldet…',
      successWithoutAutoLogin: 'Dein Konto wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden.',
      backToLogin: 'Zurück zur',
      loginLink: 'Anmeldung',
    },
    errors: {
      loginFailed: 'Anmeldung fehlgeschlagen.',
      registerFailed: 'Registrierung fehlgeschlagen.',
      confirmFailed: 'Ungültiger oder abgelaufener Code. Bitte versuche es erneut.',
      confirmOrLoginFailed: 'Bestätigung oder Anmeldung fehlgeschlagen.',
    },
  },

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

  // ── Connected Arena: game widgets ─────────────────────────────────────────
  games: {
    nextGoal:   { label: 'Minute (1–90)', prompt: 'Wann fällt das nächste Tor?' },
    corners:    { label: 'Ecken',         prompt: 'Wie viele Ecken in diesem Abschnitt?' },
    goalWindow: { label: 'Tor im Zeitfenster', yes: 'Ja', no: 'Nein' },
  },

  // ── Connected Arena: room ─────────────────────────────────────────────────
  room: {
    merge:      { notification: 'Wechsel in einen neuen Raum in' },
    connection: { open: 'Verbunden', connecting: 'Verbinde…', closed: 'Getrennt' },
  },

  // ── Connected Arena: tier badges ──────────────────────────────────────────
  tier: {
    dummies: 'Dummies', enthusiast: 'Enthusiast', amateur: 'Amateur', savvy: 'Savvy',
  },

  // ── Connected Arena: match event feed ────────────────────────────────────
  event: {
    corner: 'Ecke', goal: 'Tor', foul: 'Foul',
    yellow: 'Gelbe Karte', red: 'Rote Karte', substitution: 'Einwechslung',
  },
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

