// types/event.ts
export type KPIEventType = 'goal' | 'shot' | 'corner' | 'foul' | 'sprint';

export interface KPIEvent {
  id: string;
  matchId: string;
  type: KPIEventType;
  minute: number;
  teamSide: 'home' | 'away';
  playerId?: string;
  xG?: number;             // expected goals, 0–1
  xP?: number;             // expected probability, 0–1
  detail?: string;
}
