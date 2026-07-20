import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { today } from '../utils/date';
import { Quest } from '../types';
import { syncManager } from '../api/syncManager';
import { getActiveDailyQuestCapacityBonus } from '../engine/skillEngine';
import { applyQuestEvolution } from '../engine/questProgression';
import { useSkillStore } from './skillStore';

interface QuestState {
  quests: Quest[];
  getQuestById: (questId: string) => Quest | undefined;
  addQuest: (
    quest: Omit<
      Quest,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'isCompleted'
      | 'completedAt'
      | 'streak'
      | 'bestStreak'
      | 'daysCompleted'
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
  replaceQuests: (quests: Quest[]) => void;
  upsertQuest: (quest: Quest) => void;
  clearQuests: () => void;
}

const BASE_ACTIVE_DAILY_LIMIT = 3;

function canActivateDailyQuest(quests: Quest[]): boolean {
  const unlockedSkillIds = useSkillStore.getState().getUnlockedSkillIds();
  const activeDailyCount = quests.filter((quest) => quest.type === 'daily' && quest.isActive).length;
  const maxDailyQuests = BASE_ACTIVE_DAILY_LIMIT + getActiveDailyQuestCapacityBonus(unlockedSkillIds);
  return activeDailyCount < maxDailyQuests;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      quests: [],
      getQuestById: (questId) => get().quests.find((q) => q.id === questId),

      addQuest: (questData) => {
        const timestamp = new Date().toISOString();
        const shouldActivate =
          questData.type !== 'daily' || !questData.isActive || canActivateDailyQuest(get().quests);
        const quest: Quest = {
          ...questData,
          id: generateId(),
          createdAt: timestamp,
          updatedAt: timestamp,
          isCompleted: false,
          isActive: shouldActivate ? questData.isActive : false,
          streak: 0,
          bestStreak: 0,
          daysCompleted: 0,
        };
        set((state) => ({ quests: [...state.quests, quest] }));
        syncManager.enqueue('quest', 'upsert', quest);
      },

      completeQuest: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.isCompleted || !quest.isActive) return null;

        const timestamp = new Date().toISOString();

        const updated = applyQuestEvolution({
          ...quest,
          isCompleted: true,
          updatedAt: timestamp,
          completedAt: timestamp,
          streak: quest.streak + 1,
          bestStreak: Math.max(quest.bestStreak, quest.streak + 1),
          daysCompleted: quest.daysCompleted + 1,
        });

        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? updated : q)),
        }));
        syncManager.enqueue('quest', 'upsert', updated);

        return updated;
      },

      deleteQuest: (questId) => {
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }));
        syncManager.enqueue('quest', 'delete', { id: questId });
      },

      toggleQuestActive: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest) return;
        if (quest.type === 'daily' && !quest.isActive && !canActivateDailyQuest(get().quests)) {
          return;
        }

        const updated: Quest = {
          ...quest,
          isActive: !quest.isActive,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? updated : q)),
        }));
        syncManager.enqueue('quest', 'upsert', updated);
      },

      getDailyQuests: () => get().quests.filter((q) => q.type === 'daily'),
      getSideQuests: () => get().quests.filter((q) => q.type === 'side'),
      getBossQuests: () => get().quests.filter((q) => q.type === 'boss'),
      getActiveQuests: () => get().quests.filter((q) => q.isActive && !q.isCompleted),

      completeBossStep: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.type !== 'boss' || !quest.totalSteps || quest.isCompleted || !quest.isActive) {
          return null;
        }

        const newCompleted = (quest.completedSteps || 0) + 1;
        const isFullyDone = newCompleted >= quest.totalSteps;
        const timestamp = new Date().toISOString();

        const updated: Quest = {
          ...quest,
          updatedAt: timestamp,
          completedSteps: newCompleted,
          isCompleted: isFullyDone,
          completedAt: isFullyDone ? timestamp : undefined,
          streak: isFullyDone ? quest.streak + 1 : quest.streak,
          bestStreak: isFullyDone ? Math.max(quest.bestStreak, quest.streak + 1) : quest.bestStreak,
          daysCompleted: isFullyDone ? quest.daysCompleted + 1 : quest.daysCompleted,
        };

        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? updated : q)),
        }));
        syncManager.enqueue('quest', 'upsert', updated);

        return updated;
      },

      resetDailyQuests: () => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type === 'daily' && q.isCompleted) {
              const completedDate = q.completedAt?.split('T')[0];
              if (completedDate !== today()) {
                return {
                  ...q,
                  isCompleted: false,
                  completedAt: undefined,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            return q;
          }),
        }));
      },

      replaceQuests: (quests) => set({ quests }),

      upsertQuest: (quest) =>
        set((state) => {
          const exists = state.quests.some((current) => current.id === quest.id);
          return {
            quests: exists
              ? state.quests.map((current) => (current.id === quest.id ? quest : current))
              : [...state.quests, quest],
          };
        }),

      clearQuests: () => set({ quests: [] }),
    }),
    {
      name: 'life-rpg-quests',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
