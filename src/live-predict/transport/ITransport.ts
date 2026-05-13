// transport/ITransport.ts

export type WSMessageType =
  | 'frame'
  | 'event'
  | 'market.new'
  | 'market.update'
  | 'market.settled';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
}

export interface ITransport {
  connect(): void;
  disconnect(): void;
  onMessage: ((msg: WSMessage) => void) | null;
  onClose: (() => void) | null;
}
