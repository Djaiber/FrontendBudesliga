// transport/WebSocketTransport.ts
// Real WebSocket transport connecting to wss://api/live/:matchId

import type { ITransport, WSMessage } from './ITransport';

export class WebSocketTransport implements ITransport {
  onMessage: ((msg: WSMessage) => void) | null = null;
  onClose: (() => void) | null = null;

  private ws: WebSocket | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event: MessageEvent) => {
      if (!this.onMessage) return;
      try {
        const msg = JSON.parse(event.data as string) as WSMessage;
        this.onMessage(msg);
      } catch (err) {
        console.error('[WebSocketTransport] Failed to parse message:', err);
      }
    };

    this.ws.onclose = () => {
      this.onClose?.();
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
