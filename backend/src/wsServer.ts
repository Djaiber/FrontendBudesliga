import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import type { Server } from 'http';
import { parseMatchInfo } from './parsers/matchInfoParser';
import { parseKpiData } from './parsers/kpiParser';
import { streamPositions, setBallCache } from './parsers/positionsParser';
import type { Frame, WSMessage } from './types';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../bundes_data');

// Frame cadence: 40 ms between frames (25 Hz real-time)
// Set higher (e.g. 200 ms) to reduce bandwidth during development.
const FRAME_DELAY_MS = 200;

/**
 * Attaches a WebSocket server to the provided HTTP server.
 *
 * Protocol (all messages are JSON):
 *   → Client connects to ws://host/live/:matchId
 *   ← Server sends { type: 'frame', payload: Frame } at FRAME_DELAY_MS intervals
 *   ← Server sends { type: 'status', payload: { message } } on events
 *
 * The server streams the full Positions XML once, then loops.
 */
export function attachWebSocketServer(httpServer: Server): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  // Pre-load roster + ball positions once
  let roster: ReturnType<typeof parseMatchInfo>['players'] | null = null;
  let ballLoaded = false;

  function initData() {
    if (roster) return;
    const { players } = parseMatchInfo(path.join(DATA_DIR, 'MatchInformations_Anonym.xml'));
    roster = players;
    const { ballPositions } = parseKpiData(path.join(DATA_DIR, 'kpi_data_Bayern_Hamburg.xml'));
    setBallCache(ballPositions);
    ballLoaded = true;
    console.log(`[WS] Data ready: ${players.length} players, ${ballPositions.size} ball events`);
  }

  wss.on('connection', (ws: WebSocket, req) => {
    const matchId = req.url?.split('/').pop() ?? 'unknown';
    console.log(`[WS] Client connected — matchId: ${matchId}`);

    send(ws, { type: 'status' as const, payload: { message: 'Verbunden. Streaming startet…' } });

    try {
      initData();
    } catch (err) {
      send(ws, { type: 'status' as const, payload: { message: 'Datenfehler: ' + String(err) } });
      ws.close();
      return;
    }

    let frameIndex = 0;
    let stopped = false;

    const rosterMap = new Map(roster!.map((p) => [p.personId, p]));

    // Collect all frames first, then replay with controlled timing
    const allFrames: Frame[] = [];
    let streamDone = false;

    streamPositions(path.join(DATA_DIR, 'Positions_Bayern_Hamburg.xml'), {
      roster: rosterMap,
      sampleEvery: 10,
      maxFrames: 1500,
      onFrame: (frame) => allFrames.push(frame),
      onEnd: () => {
        streamDone = true;
        startReplay();
      },
    }).catch((err) => {
      console.error('[WS] Stream error:', err);
    });

    function startReplay() {
      const interval = setInterval(() => {
        if (stopped || ws.readyState !== WebSocket.OPEN) {
          clearInterval(interval);
          return;
        }
        if (!streamDone && allFrames.length === 0) return;

        const frame = allFrames[frameIndex % allFrames.length];
        // Patch timestamp to be current so clients' lerp alpha is correct
        const patchedFrame = { ...frame, timestamp: Date.now() };
        send(ws, { type: 'frame' as const, payload: patchedFrame });
        frameIndex++;
      }, FRAME_DELAY_MS);

      ws.on('close', () => {
        stopped = true;
        clearInterval(interval);
        console.log(`[WS] Client disconnected — matchId: ${matchId}`);
      });
    }
  });

  console.log('[WS] WebSocket server ready at ws://localhost/live/:matchId');
}

function send(ws: WebSocket, msg: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
