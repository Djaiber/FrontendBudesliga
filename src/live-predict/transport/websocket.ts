// Connected Arena WebSocket transport — singleton used across the Live Predict section.

// ── Message types ──────────────────────────────────────────────────────────────

export interface Player {
  userId: string;
  name: string;
  score: number;
  tier: string;
  streak: number;
}

export interface LeaderboardEntry extends Player {}

export interface PredictionWindowOpenMsg {
  type: 'PREDICTION_WINDOW_OPEN';
  windowId: string;
  game: string;
  prompt: string;
  deadlineMs: number;
  options?: string[];
}

export type IncomingMessage =
  | { type: 'ROOM_JOINED'; roomId: string; players: Player[] }
  | { type: 'ROOM_MERGED'; newRoomId: string; players: Player[]; countdownMs: number }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; userId: string }
  | PredictionWindowOpenMsg
  | { type: 'PREDICTION_WINDOW_CLOSE'; windowId: string }
  | {
      type: 'PREDICTION_RESULT';
      windowId: string;
      winners: string[];
      scores: Record<string, number>;
      streaks: Record<string, number>;
    }
  | { type: 'MATCH_EVENT'; minute: number; second: number; eventType: string; team: string }
  | { type: 'LEADERBOARD_UPDATE'; entries: LeaderboardEntry[] }
  | { type: 'EMOJI_BROADCAST'; userId: string; emoji: string }
  | { type: 'PONG' };

export type OutgoingMessage =
  | { type: 'JOIN_ROOM' }
  | { type: 'SUBMIT_PREDICTION'; windowId: string; value: string | number }
  | { type: 'EMOJI'; emoji: string }
  | { type: 'PING' };

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'reconnecting';

type MessageHandler = (payload: IncomingMessage) => void;
type StateHandler = (state: ConnectionState) => void;

// ── Constants ──────────────────────────────────────────────────────────────────

const PING_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 5_000;
const MAX_MISSED_PINGS = 3;
const BACKOFF_DELAYS_MS = [1_000, 2_000, 4_000, 8_000];
const MAX_BACKOFF_MS = 30_000;

// ── ArenaWebSocket ─────────────────────────────────────────────────────────────

class ArenaWebSocket {
  private ws: WebSocket | null = null;
  private idToken = '';
  private _state: ConnectionState = 'idle';

  private handlers = new Map<string, Set<MessageHandler>>();
  private stateHandlers = new Set<StateHandler>();

  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private missedPings = 0;

  // ── Public API ──────────────────────────────────────────────────────────────

  get connectionState(): ConnectionState {
    return this._state;
  }

  connect(idToken: string): void {
    // Close existing socket before opening a new one (prevents duplicates on re-renders)
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(1000, 'Reconnecting');
      this.ws = null;
    }
    this.idToken = idToken;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.setState('closed');
  }

  send(message: OutgoingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(eventType: string, handler: MessageHandler): void {
    let set = this.handlers.get(eventType);
    if (!set) {
      set = new Set();
      this.handlers.set(eventType, set);
    }
    set.add(handler);
  }

  off(eventType: string, handler: MessageHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  onStateChange(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private setState(next: ConnectionState): void {
    if (this._state === next) return;
    this._state = next;
    this.stateHandlers.forEach((h) => h(next));
  }

  private openSocket(): void {
    const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (!wsUrl) return;

    this.setState(this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

    const url = `${wsUrl}?token=${encodeURIComponent(this.idToken)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.missedPings = 0;
      this.setState('open');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      let msg: IncomingMessage;
      try {
        msg = JSON.parse(event.data as string) as IncomingMessage;
      } catch {
        return;
      }
      if (msg.type === 'PONG') {
        this.missedPings = 0;
        if (this.pongTimeout !== null) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
      }
      this.handlers.get(msg.type)?.forEach((h) => h(msg));
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (!this.intentionalClose) this.scheduleReconnect();
    };

    // onerror always precedes onclose; let onclose handle reconnect
    this.ws.onerror = () => undefined;
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      BACKOFF_DELAYS_MS[this.reconnectAttempt] ?? MAX_BACKOFF_MS,
      MAX_BACKOFF_MS,
    );
    this.reconnectAttempt++;
    this.setState('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose) this.openSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' });
      this.pongTimeout = setTimeout(() => {
        this.missedPings++;
        if (this.missedPings >= MAX_MISSED_PINGS) {
          this.ws?.close();
        }
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const websocket = new ArenaWebSocket();