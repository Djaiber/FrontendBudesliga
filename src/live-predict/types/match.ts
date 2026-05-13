// types/match.ts
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;       // e.g. "FCB"
  logoUrl: string;
}

export interface Match {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  minute: number;          // 0–90+
  status: MatchStatus;
  openMarketCount: number;
}
