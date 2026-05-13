// transport/MockTransport.ts
// Replays simulation_output.json at the correct relative cadence.
// Requirements: 15.1, 15.2, 15.5

import type { ITransport, WSMessage } from './ITransport';
import simulationData from './simulation_output.json';

export class MockTransport implements ITransport {
  onMessage: ((msg: WSMessage) => void) | null = null;
  onClose: (() => void) | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_matchId?: string) {}

  private timers: ReturnType<typeof setTimeout>[] = [];

  connect(): void {
    const { messages } = simulationData;

    for (const msg of messages) {
      const timer = setTimeout(() => {
        this.onMessage?.({
          type: msg.type as WSMessage['type'],
          payload: msg.payload,
        });
      }, msg.offsetMs);
      this.timers.push(timer);
    }

    // Seamless loop: after the last message fires, wait 100 ms then restart
    const lastOffset = messages[messages.length - 1].offsetMs;
    const loopTimer = setTimeout(() => {
      this.disconnect();
      this.connect();
    }, lastOffset + 100);
    this.timers.push(loopTimer);
  }

  disconnect(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.onClose?.();
  }
}
