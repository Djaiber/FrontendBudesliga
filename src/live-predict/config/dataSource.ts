// config/dataSource.ts
// Single flag: flip to false to connect to the real backend
export const USE_MOCK = false;

import type { ITransport } from '@/transport/ITransport';
import { MockTransport } from '@/transport/MockTransport';
import { WebSocketTransport } from '@/transport/WebSocketTransport';
import simulationData from '@/transport/simulation_output.json';
import type { Match } from '@/types/match';
import type { Bet } from '@/types/bet';

// ---------------------------------------------------------------------------
// PlaceBetRequest — defined here because it is the API boundary type
// ---------------------------------------------------------------------------
export interface PlaceBetRequest {
  marketId: string;
  outcomeId: string;
  stake: number;
  decimalOdds: number;
  matchId: string;
  marketQuestion: string;
  outcomeLabel: string;
}

// ---------------------------------------------------------------------------
// IApiClient interface
// ---------------------------------------------------------------------------
export interface IApiClient {
  getLiveMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match>;
  placeBet(req: PlaceBetRequest): Promise<Bet>;
}

// ---------------------------------------------------------------------------
// Mock API client — backed by simulation_output.json
// ---------------------------------------------------------------------------

class MockApiClient implements IApiClient {
  async getLiveMatches(): Promise<Match[]> {
    return [simulationData.matchMeta as Match];
  }

  async getMatch(_id: string): Promise<Match> {
    return simulationData.matchMeta as Match;
  }

  async placeBet(req: PlaceBetRequest): Promise<Bet> {
    return {
      id: crypto.randomUUID(),
      matchId: req.matchId,
      marketId: req.marketId,
      marketQuestion: req.marketQuestion,
      outcomeId: req.outcomeId,
      outcomeLabel: req.outcomeLabel,
      decimalOdds: req.decimalOdds,
      stake: req.stake,
      potentialReturn: req.stake * req.decimalOdds,
      actualReturn: 0,
      status: 'ausstehend',
      placedAt: Date.now(),
    };
  }
}

// ---------------------------------------------------------------------------
// Real API client — calls the live REST backend
// ---------------------------------------------------------------------------

class RealApiClient implements IApiClient {
  async getLiveMatches(): Promise<Match[]> {
    throw new Error('RealApiClient: not implemented');
  }

  async getMatch(_id: string): Promise<Match> {
    throw new Error('RealApiClient: not implemented');
  }

  async placeBet(_req: PlaceBetRequest): Promise<Bet> {
    throw new Error('RealApiClient: not implemented');
  }
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

export function createTransport(matchId: string): ITransport {
  if (USE_MOCK) {
    return new MockTransport(matchId);
  }

  const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (!wsUrl) {
    throw new Error('VITE_WS_URL environment variable is not set');
  }

  // TODO: get real Cognito token from authStore
  // For now, ACCEPT_ANY_TOKEN=true in backend allows any token
  const token = 'dev-token';
  const url = `${wsUrl}?token=${token}`;

  return new WebSocketTransport(url);
}

// ---------------------------------------------------------------------------
// API client factory
// ---------------------------------------------------------------------------
export function createApiClient(): IApiClient {
  return USE_MOCK ? new MockApiClient() : new RealApiClient();
}
