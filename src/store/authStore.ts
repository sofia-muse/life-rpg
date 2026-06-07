import { create } from 'zustand';
import { authApi, ApiUser } from '../api/auth';
import { env } from '../config/env';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  error: string | null;
  /** Resolve the current session on app start (no-op in demo mode). */
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,

  async bootstrap() {
    // Demo mode runs fully local — treat as a guest and never call the backend.
    if (env.demoMode) {
      set({ status: 'guest', user: null });
      return;
    }
    try {
      if (await authApi.hasToken()) {
        const user = await authApi.getMe();
        set({ status: 'authenticated', user, error: null });
      } else {
        set({ status: 'guest', user: null });
      }
    } catch {
      set({ status: 'guest', user: null });
    }
  },

  async login(email, password) {
    try {
      const user = await authApi.login(email, password);
      set({ status: 'authenticated', user, error: null });
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Login failed' });
      return false;
    }
  },

  async register(email, password, displayName) {
    try {
      const user = await authApi.register(email, password, displayName);
      set({ status: 'authenticated', user, error: null });
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Registration failed' });
      return false;
    }
  },

  async logout() {
    await authApi.logout();
    set({ status: 'guest', user: null });
  },
}));
