import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyCupSummary } from '../config/weeklyPaths';
import { HallOfFameEntry } from '../components/game/HallOfChampions';

interface HallOfFameState {
  entries: HallOfFameEntry[];
  addEntry: (entry: HallOfFameEntry) => void;
  getEntries: () => HallOfFameEntry[];
}

export const useHallOfFameStore = create<HallOfFameState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const exists = state.entries.some(
            (e) => e.weekKey === entry.weekKey && e.heroName === entry.heroName,
          );
          if (exists) return state;
          return { entries: [entry, ...state.entries].slice(0, 50) };
        }),
      getEntries: () => get().entries,
    }),
    {
      name: 'life-rpg-hall-of-fame',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function buildHallOfFameEntry(
  weekKey: string,
  heroName: string,
  className: string,
  pathLabel: string,
  cupScore: number,
  cupRank: WeeklyCupSummary['rank'],
  contractTitle: string,
): HallOfFameEntry {
  return { weekKey, heroName, className, pathLabel, cupScore, cupRank, contractTitle };
}
