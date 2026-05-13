export interface PlayerPosition {
  playerId: string;
  jerseyNumber: number;
  teamSide: 'home' | 'away';
  x: number;              // pitch coords, metres, 0–105
  y: number;              // 0–68
  speedKmh: number;
}

export interface BallPosition {
  x: number;
  y: number;
  z: number;
}

export interface Frame {
  matchId: string;
  timestamp: number;       // Unix ms
  players: PlayerPosition[];
  ball: BallPosition;
}
