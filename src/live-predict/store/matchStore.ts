import { create } from 'zustand';
import type { Match } from '@/types/match';
import type { KPIEvent } from '@/types/event';

/** Per-team metric values for the MetricsBar. */
export interface TeamMetrics {
  /** Possession percentage 0–100 */
  possession: number;
  /** Accumulated expected goals (xG) */
  xG: number;
  /** Total shots taken */
  shots: number;
}

/** Aggregated live metrics derived from frames and KPI events. */
export interface MatchMetrics {
  home: TeamMetrics;
  away: TeamMetrics;
  /** Count of players currently sprinting (speedKmh >= 25) */
  sprintCount: number;
}

interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  events: KPIEvent[];
  metrics: MatchMetrics;
  connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  connectionError: string | null;
}

interface MatchActions {
  setMatches: (matches: Match[]) => void;
  setCurrentMatch: (match: Match) => void;
  applyGoal: (teamSide: 'home' | 'away') => void;
  addEvent: (event: KPIEvent) => void;
  setConnectionStatus: (status: MatchState['connectionStatus'], error?: string) => void;
  /** Update possession percentages (0–100 each, should sum to ~100). */
  setPossession: (homePct: number, awayPct: number) => void;
  /** Accumulate xG from a shot/goal KPI event. */
  addXG: (teamSide: 'home' | 'away', xg: number) => void;
  /** Increment shot count for a team. */
  addShot: (teamSide: 'home' | 'away') => void;
  /** Update sprint count from the latest frame (players with speedKmh >= 25). */
  setSprintCount: (count: number) => void;
  /** Update the live match minute shown in the Scoreboard. */
  setMinute: (minute: number) => void;
}

const defaultTeamMetrics = (): TeamMetrics => ({ possession: 50, xG: 0, shots: 0 });

const defaultMetrics = (): MatchMetrics => ({
  home: defaultTeamMetrics(),
  away: defaultTeamMetrics(),
  sprintCount: 0,
});

export const useMatchStore = create<MatchState & MatchActions>((set) => ({
  // initial state
  matches: [],
  currentMatch: null,
  events: [],
  metrics: defaultMetrics(),
  connectionStatus: 'disconnected',
  connectionError: null,

  // actions
  setMatches: (matches) => set({ matches }),

  setCurrentMatch: (match) => set({ currentMatch: match }),

  applyGoal: (teamSide) =>
    set((state) => {
      if (!state.currentMatch) return state;
      return {
        currentMatch: {
          ...state.currentMatch,
          homeScore:
            teamSide === 'home'
              ? state.currentMatch.homeScore + 1
              : state.currentMatch.homeScore,
          awayScore:
            teamSide === 'away'
              ? state.currentMatch.awayScore + 1
              : state.currentMatch.awayScore,
        },
      };
    }),

  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  setConnectionStatus: (status, error) =>
    set({ connectionStatus: status, connectionError: error ?? null }),

  setPossession: (homePct, awayPct) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        home: { ...state.metrics.home, possession: homePct },
        away: { ...state.metrics.away, possession: awayPct },
      },
    })),

  addXG: (teamSide, xg) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        [teamSide]: {
          ...state.metrics[teamSide],
          xG: state.metrics[teamSide].xG + xg,
        },
      },
    })),

  addShot: (teamSide) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        [teamSide]: {
          ...state.metrics[teamSide],
          shots: state.metrics[teamSide].shots + 1,
        },
      },
    })),

  setSprintCount: (count) =>
    set((state) => ({
      metrics: { ...state.metrics, sprintCount: count },
    })),

  setMinute: (minute) =>
    set((state) => {
      if (!state.currentMatch) return state;
      return { currentMatch: { ...state.currentMatch, minute } };
    }),
}));
