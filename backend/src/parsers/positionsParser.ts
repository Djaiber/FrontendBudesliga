import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import type { Frame, PlayerInfo } from '../types';

export interface StreamPositionsOptions {
  /** Roster from MatchInformations (PersonId → PlayerInfo) */
  roster: Map<string, PlayerInfo>;
  /** Fired for each complete frame snapshot */
  onFrame: (frame: Frame) => void;
  /** Called when the file is fully read */
  onEnd: () => void;
  /** Sample rate: only emit every Nth frame (default 10 = 400 ms at 25 Hz) */
  sampleEvery?: number;
  /** Stop after this many emitted frames (default unlimited) */
  maxFrames?: number;
}

const BASE_FRAME_N = 10001;
const KICKOFF_UNIX_MS = Date.UTC(2025, 0, 1, 16, 30, 17, 80);
const MATCH_ID = 'DFL-MAT-111111';

// Ball positions cache (frameN → {x, y}) — populated externally via setBallCache
let ballCache: Map<number, { x: number; y: number }> = new Map();
let sortedBallFrameIds: number[] = [];

export function setBallCache(cache: Map<number, { x: number; y: number }>): void {
  ballCache = cache;
  sortedBallFrameIds = Array.from(cache.keys()).sort((a, b) => a - b);
}

function getBallAtFrame(n: number): { x: number; y: number } {
  if (sortedBallFrameIds.length === 0) return { x: 52.5, y: 34 };
  let best = sortedBallFrameIds[0];
  for (const fid of sortedBallFrameIds) {
    if (fid <= n) best = fid;
    else break;
  }
  return ballCache.get(best) ?? { x: 52.5, y: 34 };
}

/**
 * Streams Positions_Bayern_Hamburg.xml line-by-line.
 * Emits complete Frame objects via onFrame callback.
 * Suitable for use in a WebSocket streaming endpoint.
 */
export async function streamPositions(
  filePath: string,
  options: StreamPositionsOptions,
): Promise<void> {
  const {
    roster,
    onFrame,
    onEnd,
    sampleEvery = 10,
    maxFrames = Infinity,
  } = options;

  return new Promise((resolve, reject) => {
    // frameN → Map<personId, PlayerPosition>
    const snapshots = new Map<number, Map<string, { x: number; y: number; speedKmh: number; jerseyNumber: number; teamSide: 'home' | 'away' }>>();
    let currentPersonId: string | null = null;
    let emittedCount = 0;

    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      if (emittedCount >= maxFrames) return;

      const t = line.trim();

      if (t.startsWith('<FrameSet ')) {
        const pm = t.match(/PersonId="([^"]+)"/);
        currentPersonId = pm ? pm[1] : null;
        return;
      }
      if (t === '</FrameSet>') { currentPersonId = null; return; }
      if (!currentPersonId) return;

      const playerInfo = roster.get(currentPersonId);
      if (!playerInfo) return;

      if (!t.startsWith('<Frame ')) return;
      const nMatch = t.match(/\bN="(\d+)"/);
      if (!nMatch) return;
      const n = parseInt(nMatch[1], 10);

      if ((n - BASE_FRAME_N) % sampleEvery !== 0) return;

      const xMatch = t.match(/\bX="([^"]+)"/);
      const yMatch = t.match(/\bY="([^"]+)"/);
      const sMatch = t.match(/\bS="([^"]+)"/);
      if (!xMatch || !yMatch || !sMatch) return;

      if (!snapshots.has(n)) snapshots.set(n, new Map());
      snapshots.get(n)!.set(currentPersonId, {
        // Both axes are centered at (0,0): shift to absolute pitch coords
        x: Math.max(0, Math.min(105, parseFloat(xMatch[1]) + 52.5)),
        y: Math.max(0, Math.min(68,  parseFloat(yMatch[1]) + 34)),
        speedKmh: Math.max(0, parseFloat(sMatch[1]) * 3.6),
        jerseyNumber: playerInfo.shirtNumber,
        teamSide: playerInfo.teamSide,
      });
    });

    rl.on('close', () => {
      const sortedNs = Array.from(snapshots.keys()).sort((a, b) => a - b);
      for (const n of sortedNs) {
        if (emittedCount >= maxFrames) break;
        const pMap = snapshots.get(n)!;
        if (pMap.size < 10) continue;

        const ball = getBallAtFrame(n);
        const offsetMs = (n - BASE_FRAME_N) * 40;

        const frame: Frame = {
          matchId: MATCH_ID,
          frameN: n,
          timestamp: KICKOFF_UNIX_MS + offsetMs,
          players: Array.from(pMap.entries()).map(([personId, pos]) => ({
            playerId: personId,
            jerseyNumber: pos.jerseyNumber,
            teamSide: pos.teamSide,
            x: pos.x,
            y: pos.y,
            speedKmh: pos.speedKmh,
          })),
          ball: { x: ball.x, y: ball.y, z: 0 },
        };

        onFrame(frame);
        emittedCount++;
      }

      onEnd();
      resolve();
    });

    rl.on('error', reject);
  });
}
