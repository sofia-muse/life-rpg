import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletionEvent } from './completionStore';
import { useSettingsStore } from './settingsStore';

export interface LibraryRun {
  heroId: string;
  questId: string;
  habit: string;
  minutes: number;
  startedAt: string;
  claimedAt?: string;
}
export const LIBRARY_DAYS = 5;
export const LIBRARY_TITLE_ID = 'custom:Keeper of the Starlit Library';

export function libraryProgress(run: LibraryRun, events: CompletionEvent[]): number {
  return Math.min(LIBRARY_DAYS, new Set(events.filter((event) =>
    event.questId === run.questId && Date.parse(event.completedAt) >= Date.parse(run.startedAt),
  ).map((event) => event.completedAt.slice(0, 10))).size);
}

interface LibraryState {
  run: LibraryRun | null;
  start: (run: Omit<LibraryRun, 'startedAt' | 'claimedAt'>) => boolean;
  claim: (heroId: string, events: CompletionEvent[]) => boolean;
  clear: () => void;
}
export const useLibraryStore = create<LibraryState>()(persist((set, get) => ({
  run: null,
  start: (run) => {
    if (get().run?.heroId === run.heroId || !run.habit.trim() || !Number.isInteger(run.minutes)
      || run.minutes < 5 || run.minutes > 60) return false;
    set({ run: { ...run, habit: run.habit.trim(), startedAt: new Date().toISOString() } });
    return true;
  },
  claim: (heroId, events) => {
    const run = get().run;
    if (!run || run.heroId !== heroId || run.claimedAt || libraryProgress(run, events) < LIBRARY_DAYS) return false;
    // Unlock is idempotent: replay after an interrupted save cannot duplicate a reward.
    useSettingsStore.getState().unlockTitle(LIBRARY_TITLE_ID, 'Keeper of the Starlit Library');
    set({ run: { ...run, claimedAt: new Date().toISOString() } });
    return true;
  },
  clear: () => set({ run: null }),
}), { name: 'life-rpg-library-v1', storage: createJSONStorage(() => AsyncStorage) }));
