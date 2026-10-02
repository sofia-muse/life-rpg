import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { JournalEntry } from '../types';
import { syncManager } from '../api/syncManager';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  getTodayEntry: () => JournalEntry | undefined;
  getEntriesByDate: (date: string) => JournalEntry[];
  updateTodayEntry: (updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => void;
  clearEntries: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

const emptyXpGained = () => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
});

function mergeUnique<T>(left: T[], right: T[] = []): T[] {
  return [...new Set([...left, ...right])];
}

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
          const merged: JournalEntry = {
            ...existing,
            ...updates,
            narrative: [existing.narrative, updates.narrative].filter(Boolean).join('\n\n'),
            questsCompleted: mergeUnique(existing.questsCompleted, updates.questsCompleted),
            xpGained: {
              strength: existing.xpGained.strength + (updates.xpGained?.strength ?? 0),
              vitality: existing.xpGained.vitality + (updates.xpGained?.vitality ?? 0),
              intelligence: existing.xpGained.intelligence + (updates.xpGained?.intelligence ?? 0),
              charisma: existing.xpGained.charisma + (updates.xpGained?.charisma ?? 0),
              dexterity: existing.xpGained.dexterity + (updates.xpGained?.dexterity ?? 0),
              willpower: existing.xpGained.willpower + (updates.xpGained?.willpower ?? 0),
            },
            levelsGained: mergeUnique(existing.levelsGained, updates.levelsGained),
            skillsUnlocked: mergeUnique(existing.skillsUnlocked, updates.skillsUnlocked),
            milestones: mergeUnique(existing.milestones, updates.milestones),
            tomorrowVow:
              updates.tomorrowVow !== undefined ? updates.tomorrowVow : existing.tomorrowVow,
            tomorrowVowTemplateTitle:
              updates.tomorrowVowTemplateTitle !== undefined
                ? updates.tomorrowVowTemplateTitle
                : existing.tomorrowVowTemplateTitle,
          };
          set((state) => ({
            entries: state.entries.map((e) => (e.id === existing.id ? merged : e)),
          }));
          syncManager.enqueue('journal', 'upsert', merged);
        } else {
          // Create new entry for today
          const newEntry: JournalEntry = {
            id: generateId(),
            date: todayStr,
            narrative: '',
            questsCompleted: [],
            xpGained: emptyXpGained(),
            levelsGained: [],
            skillsUnlocked: [],
            milestones: [],
            ...updates,
          };
          set((state) => ({ entries: [newEntry, ...state.entries] }));
          syncManager.enqueue('journal', 'upsert', newEntry);
        }
      },

      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: 'life-rpg-journal',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
