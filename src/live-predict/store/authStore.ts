/**
 * Auth store — Zustand slice for AWS Cognito authentication.
 *
 * Actions:
 *   login          — signIn with email + password
 *   logout         — signOut and clear state
 *   register       — signUp with email + password
 *   confirmSignUp  — submit 6-digit OTP to verify account
 *   checkSession   — restore session on app load (getCurrentUser)
 */
import { create } from 'zustand';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

export interface AuthUser {
  username: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ── State ──────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signIn({ username: email, password });
      const cognitoUser = await getCurrentUser();
      set({
        user: { username: cognitoUser.username, email },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.';
      set({ error: message, isLoading: false });
    }
  },

  confirmSignUp: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      await amplifyConfirmSignUp({ username: email, confirmationCode: code });
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ungültiger oder abgelaufener Code. Bitte versuche es erneut.';
      set({ error: message, isLoading: false });
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const [cognitoUser, session] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession(),
      ]);
      // Treat session as valid only when access tokens are present
      if (!session.tokens?.accessToken) {
        throw new Error('No valid tokens');
      }
      set({
        user: { username: cognitoUser.username, email: cognitoUser.username },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // No active session — not an error, just unauthenticated
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
