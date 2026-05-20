import { readFileSync } from 'fs';
import type { MatchInfo, PlayerInfo, TeamInfo } from '../types';

/**
 * Parses MatchInformations_Anonym.xml into structured objects.
 * Returns the match metadata and a flat roster of all players.
 */
export function parseMatchInfo(filePath: string): {
  match: MatchInfo;
  players: PlayerInfo[];
} {
  const xml = readFileSync(filePath, 'utf-8');

  // ── General match attributes ───────────────────────────────────────────────
  const generalMatch = xml.match(/<General\b([^>]+)>/);
  if (!generalMatch) throw new Error('MatchInformations: <General> not found');
  const genAttrs = generalMatch[1];

  function attr(src: string, name: string): string {
    const m = src.match(new RegExp(`\\b${name}="([^"]+)"`));
    return m ? m[1] : '';
  }

  // ── Teams ──────────────────────────────────────────────────────────────────
  const teamBlocks = [...xml.matchAll(/<Team\b[\s\S]*?<\/Team>/g)].map((m) => m[0]);
  const teams: TeamInfo[] = teamBlocks.map((block) => ({
    teamId: attr(block, 'TeamId'),
    teamName: attr(block, 'TeamName'),
    shortName: attr(block, 'ShortName'),
    role: attr(block, 'Role') === 'home' ? 'home' : 'away',
    formation: attr(block, 'LineUp'),
  }));

  const homeTeam = teams.find((t) => t.role === 'home')!;
  const awayTeam = teams.find((t) => t.role === 'away')!;

  // ── Players ────────────────────────────────────────────────────────────────
  const players: PlayerInfo[] = [];

  for (const teamBlock of teamBlocks) {
    const teamId = attr(teamBlock, 'TeamId');
    const teamRole = attr(teamBlock, 'Role');
    const teamSide: 'home' | 'away' = teamRole === 'home' ? 'home' : 'away';

    const playerMatches = [...teamBlock.matchAll(/<Player\b([^/]+)\/>/g)];
    for (const pm of playerMatches) {
      const p = pm[1];
      players.push({
        personId: attr(p, 'PersonId'),
        shirtNumber: parseInt(attr(p, 'ShirtNumber') || '0', 10),
        firstName: attr(p, 'FirstName'),
        lastName: attr(p, 'LastName'),
        teamSide,
        teamId,
        playingPosition: attr(p, 'PlayingPosition') || undefined,
        starting: attr(p, 'Starting') === 'true',
      });
    }
  }

  const match: MatchInfo = {
    matchId: attr(genAttrs, 'MatchId'),
    homeTeam,
    awayTeam,
    kickoffTime: attr(genAttrs, 'KickoffTime'),
    result: attr(genAttrs, 'Result'),
    competition: attr(genAttrs, 'CompetitionName'),
    matchDay: parseInt(attr(genAttrs, 'MatchDay') || '0', 10),
    season: attr(genAttrs, 'Season'),
  };

  return { match, players };
}
