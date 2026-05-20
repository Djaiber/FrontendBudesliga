/**
 * parse-xml-positions.mjs
 *
 * Streaming parser for the 421 MB Positions_Bayern_Hamburg.xml.
 * Reads player tracking data line-by-line (no full-file load), builds
 * frame snapshots sampled at 400 ms intervals, and writes
 * src/live-predict/transport/xml_frames.json.
 *
 * Run: node scripts/parse-xml-positions.mjs
 */

import { readFileSync, createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve as pathResolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = pathResolve(__dirname, '..');
const DATA_DIR = pathResolve(ROOT, 'bundes_data');
const OUT_PATH = pathResolve(ROOT, 'src', 'live-predict', 'transport', 'xml_frames.json');

// Sampling config
const SAMPLE_EVERY = 10;    // every 10th frame = 400 ms at 25 Hz
const MAX_SNAPSHOTS = 1500; // ~10 minutes of data
const BASE_FRAME_N = 10001; // first frame number in the XML

// Must match simulation_output.json matchId
const MATCH_ID = 'match-001';

// Kickoff timestamp derived from the XML: 2025-01-01T16:30:17.080Z
const KICKOFF_UNIX_MS = Date.UTC(2025, 0, 1, 16, 30, 17, 80);

// ---------------------------------------------------------------------------
// Step 1 — Parse MatchInformations for PersonId → {teamSide, jerseyNumber}
// ---------------------------------------------------------------------------
function parseRoster(xml) {
  const roster = new Map();

  // Split the XML into per-team sections so we can associate players correctly
  const teamBlockRe = /<Team\b[\s\S]*?<\/Team>/g;
  let teamBlock;
  while ((teamBlock = teamBlockRe.exec(xml)) !== null) {
    const roleMatch = teamBlock[0].match(/\bRole="([^"]+)"/);
    if (!roleMatch) continue;
    const teamSide = roleMatch[1] === 'home' ? 'home' : 'away';

    const playerRe = /<Player\b[^>]*PersonId="([^"]+)"[^>]*ShirtNumber="(\d+)"[^>]*\/>/g;
    let pm;
    while ((pm = playerRe.exec(teamBlock[0])) !== null) {
      roster.set(pm[1], {
        teamSide,
        jerseyNumber: parseInt(pm[2], 10),
      });
    }
  }

  return roster;
}

// ---------------------------------------------------------------------------
// Step 2 — Parse kpi_data for ball positions at specific frame IDs
// ---------------------------------------------------------------------------
function parseBallPositions(xml) {
  const ballPositions = new Map(); // frameId (int) → {x, y}

  // Events often have multiple attributes on the same line; look for the trio
  const lineRe = /SyncedFrameId="(\d+)"[^>]*X-Position="([^"]+)"[^>]*Y-Position="([^"]+)"|X-Position="([^"]+)"[^>]*Y-Position="([^"]+)"[^>]*SyncedFrameId="(\d+)"/g;
  let m;
  while ((m = lineRe.exec(xml)) !== null) {
    let frameId, xStr, yStr;
    if (m[1]) {
      frameId = parseInt(m[1], 10);
      xStr = m[2];
      yStr = m[3];
    } else {
      frameId = parseInt(m[6], 10);
      xStr = m[4];
      yStr = m[5];
    }
    if (!ballPositions.has(frameId)) {
      ballPositions.set(frameId, {
        // Both axes centered: shift to absolute pitch coords (0-105, 0-68)
        x: parseFloat(xStr) + 52.5,
        y: parseFloat(yStr) + 34,
      });
    }
  }

  return ballPositions;
}

// ---------------------------------------------------------------------------
// Helper — interpolate ball position at a given frame N
// ---------------------------------------------------------------------------
function makeBallLookup(ballPositions) {
  const sortedFrameIds = Array.from(ballPositions.keys()).sort((a, b) => a - b);

  return function getBallAtFrame(n) {
    if (sortedFrameIds.length === 0) return { x: 52.5, y: 34 };

    // Find the latest known ball position at or before frame n
    let best = sortedFrameIds[0];
    for (const fid of sortedFrameIds) {
      if (fid <= n) best = fid;
      else break;
    }
    return ballPositions.get(best) ?? { x: 52.5, y: 34 };
  };
}

// ---------------------------------------------------------------------------
// Step 3 — Stream Positions XML, group sampled frames by N
// ---------------------------------------------------------------------------
function streamPositions(roster, getBallAtFrame) {
  return new Promise((resolve, reject) => {
    // frameSnapshots: frameN → Map<personId, PlayerPosition>
    const frameSnapshots = new Map();

    let currentPersonId = null;

    const rl = createInterface({
      input: createReadStream(pathResolve(DATA_DIR, 'Positions_Bayern_Hamburg.xml')),
      crlfDelay: Infinity,
    });

    let totalLines = 0;

    rl.on('line', (line) => {
      totalLines++;
      if (totalLines % 5_000_000 === 0) {
        process.stdout.write(`  … ${(totalLines / 1_000_000).toFixed(1)}M lines read, ${frameSnapshots.size} frame buckets\n`);
      }

      const t = line.trim();

      // FrameSet open: identify which player this block belongs to
      if (t.startsWith('<FrameSet ')) {
        const pm = t.match(/PersonId="([^"]+)"/);
        currentPersonId = pm ? pm[1] : null;
        return;
      }

      // FrameSet close
      if (t === '</FrameSet>') {
        currentPersonId = null;
        return;
      }

      // Skip lines that don't belong to a known player
      if (!currentPersonId) return;
      const playerInfo = roster.get(currentPersonId);
      if (!playerInfo) return; // referee or unknown object

      // Frame element — only parse sampled frames
      if (!t.startsWith('<Frame ')) return;

      const nMatch = t.match(/\bN="(\d+)"/);
      if (!nMatch) return;
      const n = parseInt(nMatch[1], 10);

      // Sample every SAMPLE_EVERY frames
      if ((n - BASE_FRAME_N) % SAMPLE_EVERY !== 0) return;

      // Skip beyond our capture window
      const sampleIndex = (n - BASE_FRAME_N) / SAMPLE_EVERY;
      if (sampleIndex >= MAX_SNAPSHOTS) return;

      const xMatch = t.match(/\bX="([^"]+)"/);
      const yMatch = t.match(/\bY="([^"]+)"/);
      const sMatch = t.match(/\bS="([^"]+)"/);
      if (!xMatch || !yMatch || !sMatch) return;

      if (!frameSnapshots.has(n)) {
        frameSnapshots.set(n, new Map());
      }

      frameSnapshots.get(n).set(currentPersonId, {
        playerId: currentPersonId,
        jerseyNumber: playerInfo.jerseyNumber,
        teamSide: playerInfo.teamSide,
        // Both axes are centered at (0,0): shift to absolute pitch coords
        x: Math.max(0, Math.min(105, parseFloat(xMatch[1]) + 52.5)),
        y: Math.max(0, Math.min(68,  parseFloat(yMatch[1]) + 34)),
        speedKmh: Math.max(0, parseFloat(sMatch[1]) * 3.6),
      });
    });

    rl.on('close', () => {
      console.log(`  Streaming done. ${totalLines.toLocaleString()} lines, ${frameSnapshots.size} sampled frame buckets.`);

      // Convert snapshot map to sorted WSMessage array
      const messages = [];
      const sortedNs = Array.from(frameSnapshots.keys()).sort((a, b) => a - b);

      for (const n of sortedNs) {
        const playersMap = frameSnapshots.get(n);
        const players = Array.from(playersMap.values());

        // Skip frames with too few players (e.g. match not yet started)
        if (players.length < 10) continue;

        const offsetMs = (n - BASE_FRAME_N) * 40; // 40 ms per frame
        const timestamp = KICKOFF_UNIX_MS + offsetMs;
        const ball = getBallAtFrame(n);

        messages.push({
          offsetMs,
          type: 'frame',
          payload: {
            matchId: MATCH_ID,
            timestamp,
            players,
            ball: { x: ball.x, y: ball.y, z: 0 },
          },
        });
      }

      resolve(messages);
    });

    rl.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== parse-xml-positions.mjs ===\n');

  console.log('[1/4] Parsing MatchInformations_Anonym.xml for roster …');
  const matchInfoXml = readFileSync(
    pathResolve(DATA_DIR, 'MatchInformations_Anonym.xml'),
    'utf-8',
  );
  const roster = parseRoster(matchInfoXml);
  console.log(`      → ${roster.size} players found\n`);

  console.log('[2/4] Parsing kpi_data_Bayern_Hamburg.xml for ball positions …');
  const kpiXml = readFileSync(
    pathResolve(DATA_DIR, 'kpi_data_Bayern_Hamburg.xml'),
    'utf-8',
  );
  const ballPositions = parseBallPositions(kpiXml);
  const getBallAtFrame = makeBallLookup(ballPositions);
  console.log(`      → ${ballPositions.size} ball-position events\n`);

  console.log('[3/4] Streaming Positions_Bayern_Hamburg.xml (421 MB) …');
  const frameMessages = await streamPositions(roster, getBallAtFrame);
  console.log(`      → ${frameMessages.length} frame messages generated\n`);

  console.log('[4/4] Writing output …');
  const output = { frames: frameMessages };
  writeFileSync(OUT_PATH, JSON.stringify(output), 'utf-8');

  const sizeMB = (JSON.stringify(output).length / 1_048_576).toFixed(2);
  console.log(`      → ${OUT_PATH}`);
  console.log(`      → ${sizeMB} MB\n`);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
