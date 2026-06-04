import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { JournalEntry } from '../types';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  getTodayEntry: () => JournalEntry | undefined;
  getEntriesByDate: (date: string) => JournalEntry[];
  updateTodayEntry: (updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const entry: JournalEntry = {
          ...entryData,
          id: generateId(),
        };
        set((state) => ({ entries: [entry, ...state.entries] }));
      },

      getTodayEntry: () => {
        const todayStr = today();
        return get().entries.find((e) => e.date === todayStr);
      },

      getEntriesByDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },

      updateTodayEntry: (updates) => {
        const todayStr = today();
        const existing = get().entries.find((e) => e.date === todayStr);

        if (existing) {
          set((state) => ({
            entries: state.entries.map((e) => (e.id === existing.id ? { ...e, ...updates } : e)),
          }));
        } else {
          // Create new entry for today
          const newEntry: JournalEntry = {
            id: generateId(),
            date: todayStr,
            narrative: '',
            questsCompleted: [],
            xpGained: {
              strength: 0,
              vitality: 0,
              intelligence: 0,
              charisma: 0,
              dexterity: 0,
              willpower: 0,
            },
            levelsGained: [],
            skillsUnlocked: [],
            milestones: [],
            ...updates,
          };
          set((state) => ({ entries: [newEntry, ...state.entries] }));
        }
      },
    }),
    {
      name: 'life-rpg-journal',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
