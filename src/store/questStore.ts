import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { Quest } from '../types';

interface QuestState {
  quests: Quest[];
  addQuest: (
    quest: Omit<
      Quest,
      'id' | 'createdAt' | 'isCompleted' | 'completedAt' | 'streak' | 'bestStreak' | 'daysCompleted'
    >,
  ) => void;
  completeQuest: (questId: string) => Quest | null;
  deleteQuest: (questId: string) => void;
  toggleQuestActive: (questId: string) => void;
  getDailyQuests: () => Quest[];
  getSideQuests: () => Quest[];
  getBossQuests: () => Quest[];
  getActiveQuests: () => Quest[];
  completeBossStep: (questId: string) => Quest | null;
  resetDailyQuests: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      quests: [],

      addQuest: (questData) => {
        const quest: Quest = {
          ...questData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isCompleted: false,
          streak: 0,
          bestStreak: 0,
          daysCompleted: 0,
        };
        set((state) => ({ quests: [...state.quests, quest] }));
      },

      completeQuest: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.isCompleted) return null;

        const updated: Quest = {
          ...quest,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          streak: quest.streak + 1,
          bestStreak: Math.max(quest.bestStreak, quest.streak + 1),
          daysCompleted: quest.daysCompleted + 1,
        };

        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? updated : q)),
        }));

        return updated;
      },

      deleteQuest: (questId) => {
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }));
      },

      toggleQuestActive: (questId) => {
        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, isActive: !q.isActive } : q)),
        }));
      },

      getDailyQuests: () => get().quests.filter((q) => q.type === 'daily'),
      getSideQuests: () => get().quests.filter((q) => q.type === 'side'),
      getBossQuests: () => get().quests.filter((q) => q.type === 'boss'),
      getActiveQuests: () => get().quests.filter((q) => q.isActive && !q.isCompleted),

      completeBossStep: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.type !== 'boss' || !quest.totalSteps) return null;

        const newCompleted = (quest.completedSteps || 0) + 1;
        const isFullyDone = newCompleted >= quest.totalSteps;

        const updated: Quest = {
          ...quest,
          completedSteps: newCompleted,
          isCompleted: isFullyDone,
          completedAt: isFullyDone ? new Date().toISOString() : undefined,
        };

        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? updated : q)),
        }));

        return updated;
      },

      resetDailyQuests: () => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type === 'daily' && q.isCompleted) {
              const completedDate = q.completedAt?.split('T')[0];
              if (completedDate !== today()) {
                return { ...q, isCompleted: false, completedAt: undefined };
              }
            }
            return q;
          }),
        }));
      },
    }),
    {
      name: 'life-rpg-quests',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
