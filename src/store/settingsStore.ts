import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from '../api/syncManager';
import { WeeklyPath } from '../types';
import { getCurrentWeekKey } from '../config/weeklyPaths';

interface SettingsState {
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string;
  aiSkillsEnabled: boolean;
  fantasyNames: boolean;
  equippedTitleId: string;
  weeklyContractsCompleted: number;
  weeklyPath: WeeklyPath | null;
  weeklyPathWeekKey: string | null;
  weeklyPathStartedAt: string | null;
  weeklyRewardWeekKey: string | null;
  weeklyRewardTitle: string | null;
  weeklyRewardBadge: string | null;
  replaceSettings: (settings: {
    notificationsEnabled: boolean;
    hapticEnabled: boolean;
    reminderTime: string;
    aiSkillsEnabled: boolean;
    fantasyNames?: boolean;
    equippedTitleId?: string;
    weeklyContractsCompleted?: number;
    weeklyPath: WeeklyPath | null;
    weeklyPathWeekKey: string | null;
    weeklyPathStartedAt: string | null;
    weeklyRewardWeekKey: string | null;
    weeklyRewardTitle: string | null;
    weeklyRewardBadge: string | null;
  }) => void;
  toggleNotifications: () => void;
  toggleHaptic: () => void;
  setReminderTime: (time: string) => void;
  toggleAiSkills: () => void;
  toggleFantasyNames: () => void;
  setEquippedTitle: (titleId: string) => void;
  incrementWeeklyContractsCompleted: () => void;
  chooseWeeklyPath: (path: WeeklyPath) => void;
  claimWeeklyReward: (reward: { title: string; badge: string }) => void;
  clearStaleWeeklyPath: () => void;
}

function syncSettings(state: Pick<
  SettingsState,
  | 'notificationsEnabled'
  | 'hapticEnabled'
  | 'reminderTime'
  | 'aiSkillsEnabled'
  | 'fantasyNames'
  | 'equippedTitleId'
  | 'weeklyContractsCompleted'
  | 'weeklyPath'
  | 'weeklyPathWeekKey'
  | 'weeklyPathStartedAt'
  | 'weeklyRewardWeekKey'
  | 'weeklyRewardTitle'
  | 'weeklyRewardBadge'
>) {
  syncManager.enqueue('hero', 'upsert', {
    settings: {
      notificationsEnabled: state.notificationsEnabled,
      hapticEnabled: state.hapticEnabled,
      reminderTime: state.reminderTime,
      aiSkillsEnabled: state.aiSkillsEnabled,
      fantasyNames: state.fantasyNames,
      equippedTitleId: state.equippedTitleId,
      weeklyContractsCompleted: state.weeklyContractsCompleted,
      weeklyPath: state.weeklyPath,
      weeklyPathWeekKey: state.weeklyPathWeekKey,
      weeklyPathStartedAt: state.weeklyPathStartedAt,
      weeklyRewardWeekKey: state.weeklyRewardWeekKey,
      weeklyRewardTitle: state.weeklyRewardTitle,
      weeklyRewardBadge: state.weeklyRewardBadge,
    },
    updatedAt: new Date().toISOString(),
  });
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      hapticEnabled: true,
      reminderTime: '09:00',
      aiSkillsEnabled: false,
      fantasyNames: false,
      equippedTitleId: 'adventurer',
      weeklyContractsCompleted: 0,
      weeklyPath: null,
      weeklyPathWeekKey: null,
      weeklyPathStartedAt: null,
      weeklyRewardWeekKey: null,
      weeklyRewardTitle: null,
      weeklyRewardBadge: null,
      replaceSettings: (settings) => set(settings),

      toggleNotifications: () =>
        set((state) => {
          const next = { ...state, notificationsEnabled: !state.notificationsEnabled };
          syncSettings(next);
          return { notificationsEnabled: next.notificationsEnabled };
        }),

      toggleHaptic: () =>
        set((state) => {
          const next = { ...state, hapticEnabled: !state.hapticEnabled };
          syncSettings(next);
          return { hapticEnabled: next.hapticEnabled };
        }),

      setReminderTime: (time) =>
        set((state) => {
          syncSettings({ ...state, reminderTime: time });
          return { reminderTime: time };
        }),

      toggleAiSkills: () =>
        set((state) => {
          const next = { ...state, aiSkillsEnabled: !state.aiSkillsEnabled };
          syncSettings(next);
          return { aiSkillsEnabled: next.aiSkillsEnabled };
        }),

      toggleFantasyNames: () =>
        set((state) => {
          const next = { ...state, fantasyNames: !state.fantasyNames };
          syncSettings(next);
          return { fantasyNames: next.fantasyNames };
        }),

      setEquippedTitle: (titleId) =>
        set((state) => {
          syncSettings({ ...state, equippedTitleId: titleId });
          return { equippedTitleId: titleId };
        }),

      incrementWeeklyContractsCompleted: () =>
        set((state) => {
          const next = {
            ...state,
            weeklyContractsCompleted: state.weeklyContractsCompleted + 1,
          };
          syncSettings(next);
          return { weeklyContractsCompleted: next.weeklyContractsCompleted };
        }),

      chooseWeeklyPath: (path) =>
        set((state) => {
          const now = new Date();
          const weekKey = getCurrentWeekKey(now);
          const keepReward = state.weeklyRewardWeekKey === weekKey;
          const next = {
            ...state,
            weeklyPath: path,
            weeklyPathWeekKey: weekKey,
            weeklyPathStartedAt: now.toISOString(),
            weeklyRewardWeekKey: keepReward ? state.weeklyRewardWeekKey : null,
            weeklyRewardTitle: keepReward ? state.weeklyRewardTitle : null,
            weeklyRewardBadge: keepReward ? state.weeklyRewardBadge : null,
          };
          console.info('[SettingsStore] Weekly path selected.', {
            path,
            weekKey,
            keptExistingReward: keepReward,
          });
          syncSettings(next);
          return {
            weeklyPath: next.weeklyPath,
            weeklyPathWeekKey: next.weeklyPathWeekKey,
            weeklyPathStartedAt: next.weeklyPathStartedAt,
            weeklyRewardWeekKey: next.weeklyRewardWeekKey,
            weeklyRewardTitle: next.weeklyRewardTitle,
            weeklyRewardBadge: next.weeklyRewardBadge,
          };
        }),

      claimWeeklyReward: (reward) =>
        set((state) => {
          const weekKey = state.weeklyPathWeekKey ?? getCurrentWeekKey();
          const next = {
            ...state,
            weeklyRewardWeekKey: weekKey,
            weeklyRewardTitle: reward.title,
            weeklyRewardBadge: reward.badge,
          };
          console.info('[SettingsStore] Weekly reward claimed.', {
            weekKey,
            title: reward.title,
            badge: reward.badge,
          });
          syncSettings(next);
          return {
            weeklyRewardWeekKey: next.weeklyRewardWeekKey,
            weeklyRewardTitle: next.weeklyRewardTitle,
            weeklyRewardBadge: next.weeklyRewardBadge,
          };
        }),

      clearStaleWeeklyPath: () =>
        set((state) => {
          if (!state.weeklyPathWeekKey || state.weeklyPathWeekKey === getCurrentWeekKey()) {
            return {};
          }

          const next = {
            ...state,
            weeklyPath: null,
            weeklyPathWeekKey: null,
            weeklyPathStartedAt: null,
            weeklyRewardWeekKey: null,
            weeklyRewardTitle: null,
            weeklyRewardBadge: null,
          };
          console.info('[SettingsStore] Cleared stale weekly path state.', {
            staleWeekKey: state.weeklyPathWeekKey,
            previousPath: state.weeklyPath,
          });
          syncSettings(next);
          return {
            weeklyPath: null,
            weeklyPathWeekKey: null,
            weeklyPathStartedAt: null,
            weeklyRewardWeekKey: null,
            weeklyRewardTitle: null,
            weeklyRewardBadge: null,
          };
        }),
    }),
    {
      name: 'life-rpg-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
