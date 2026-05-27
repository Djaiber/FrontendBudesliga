import { create } from 'zustand';
import { websocket } from '../transport/websocket';
import type { Player, LeaderboardEntry } from '../transport/websocket';

export type { Player };

interface RoomState {
  roomId: string | null;
  players: Player[];
  status: 'idle' | 'joining' | 'active' | 'merging';
  mergeNotification: { newRoomId: string; countdownMs: number } | null;
}

interface RoomActions {
  joinRoom: () => void;
  leaveRoom: () => void;
  updatePlayers: (players: Player[]) => void;
  setMergeNotification: (n: { newRoomId: string; countdownMs: number }) => void;
  clearMergeNotification: () => void;
}

export const useRoomStore = create<RoomState & RoomActions>((set) => {
  websocket.on('ROOM_JOINED', (msg) => {
    if (msg.type !== 'ROOM_JOINED') return;
    set({ roomId: msg.roomId, players: msg.players, status: 'active' });
  });

  websocket.on('ROOM_MERGED', (msg) => {
    if (msg.type !== 'ROOM_MERGED') return;
    set({
      status: 'merging',
      mergeNotification: { newRoomId: msg.newRoomId, countdownMs: msg.countdownMs },
    });
  });

  websocket.on('PLAYER_JOINED', (msg) => {
    if (msg.type !== 'PLAYER_JOINED') return;
    set((s) => ({ players: [...s.players, msg.player] }));
  });

  websocket.on('PLAYER_LEFT', (msg) => {
    if (msg.type !== 'PLAYER_LEFT') return;
    set((s) => ({ players: s.players.filter((p) => p.userId !== msg.userId) }));
  });

  websocket.on('LEADERBOARD_UPDATE', (msg) => {
    if (msg.type !== 'LEADERBOARD_UPDATE') return;
    set({ players: msg.entries as LeaderboardEntry[] });
  });

  return {
    roomId: null,
    players: [],
    status: 'idle',
    mergeNotification: null,

    joinRoom: () => {
      console.log('[RoomStore] joinRoom() called, setting status to joining');
      set({ status: 'joining' });
      console.log('[RoomStore] Sending JOIN_ROOM message via websocket');
      websocket.send({ type: 'JOIN_ROOM' });
      console.log('[RoomStore] JOIN_ROOM sent');
    },

    leaveRoom: () =>
      set({ roomId: null, players: [], status: 'idle', mergeNotification: null }),

    updatePlayers: (players) => set({ players }),

    setMergeNotification: (n) => set({ mergeNotification: n }),

    clearMergeNotification: () => set({ mergeNotification: null, status: 'active' }),
  };
});