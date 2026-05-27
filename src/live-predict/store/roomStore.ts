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
  websocket.on('room_joined', (msg: any) => {
    console.log('[RoomStore] Received room_joined:', msg);
    if (msg.type !== 'room_joined') return;
    set({ roomId: msg.room_id, players: msg.players, status: 'active' });
  });

  websocket.on('room_merged', (msg: any) => {
    console.log('[RoomStore] Received room_merged:', msg);
    if (msg.type !== 'room_merged') return;
    set({
      status: 'merging',
      mergeNotification: { newRoomId: msg.new_room_id, countdownMs: msg.countdown_ms },
    });
  });

  websocket.on('player_joined', (msg: any) => {
    console.log('[RoomStore] Received player_joined:', msg);
    if (msg.type !== 'player_joined') return;
    set((s) => ({ players: [...s.players, msg.player] }));
  });

  websocket.on('player_left', (msg: any) => {
    console.log('[RoomStore] Received player_left:', msg);
    if (msg.type !== 'player_left') return;
    set((s) => ({ players: s.players.filter((p) => p.userId !== msg.user_id) }));
  });

  websocket.on('leaderboard_update', (msg: any) => {
    console.log('[RoomStore] Received leaderboard_update:', msg);
    if (msg.type !== 'leaderboard_update') return;
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