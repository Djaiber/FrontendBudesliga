import { readFileSync } from 'fs';
import type { KpiEvent } from '../types';

/**
 * Parses kpi_data_Bayern_Hamburg.xml.
 * Returns:
 *   - events: flat list of KpiEvent objects
 *   - ballPositions: frameN → {x, y} (centered coords converted to 0-68)
 */
export function parseKpiData(filePath: string): {
  events: KpiEvent[];
  ballPositions: Map<number, { x: number; y: number }>;
} {
  const xml = readFileSync(filePath, 'utf-8');

  const events: KpiEvent[] = [];
  const ballPositions = new Map<number, { x: number; y: number }>();

  function attr(src: string, name: string): string {
    const m = src.match(new RegExp(`\\b${name}="([^"]+)"`));
    return m ? m[1] : '';
  }

  // Each <Event> block contains one child element (Play, Reception, Carry, etc.)
  const eventBlocks = [...xml.matchAll(/<Event>\s*([\s\S]*?)\s*<\/Event>/g)];

  for (const block of eventBlocks) {
    const inner = block[1];
    // Extract element type from tag name
    const typeMatch = inner.match(/^<(\w+)\b/);
    if (!typeMatch) continue;
    const type = typeMatch[1];

    const eventId = attr(inner, 'EventId');
    const teamId = attr(inner, 'TeamId');
    const playerId = attr(inner, 'PlayerId');
    const gameTime = attr(inner, 'GameTime') || undefined;
    const evaluation = attr(inner, 'Evaluation') || undefined;

    const syncedFrameIdStr = attr(inner, 'SyncedFrameId');
    const xPosStr = attr(inner, 'X-Position');
    const yPosStr = attr(inner, 'Y-Position');
    const xPStr = attr(inner, 'xP');

    const syncedFrameId = syncedFrameIdStr ? parseInt(syncedFrameIdStr, 10) : undefined;
    const xPosition = xPosStr ? parseFloat(xPosStr) : undefined;
    const yPosition = yPosStr ? parseFloat(yPosStr) + 34 : undefined; // center → absolute
    const xP = xPStr ? parseFloat(xPStr) : undefined;

    // Populate ball position cache (convert centered coords to absolute pitch coords)
    if (syncedFrameId !== undefined && xPosition !== undefined && yPosition !== undefined) {
      if (!ballPositions.has(syncedFrameId)) {
        ballPositions.set(syncedFrameId, {
          x: xPosition + 52.5,
          y: yPosition,       // yPosition already has +34 applied above
        });
      }
    }

    events.push({
      eventId,
      type,
      teamId,
      playerId,
      gameTime,
      syncedFrameId,
      xPosition,
      yPosition: yPosStr ? parseFloat(yPosStr) : undefined, // raw centered Y for API consumers
      xP,
      evaluation,
    });
  }

  return { events, ballPositions };
}
