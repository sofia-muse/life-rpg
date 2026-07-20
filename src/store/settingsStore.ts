import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from '../api/syncManager';
import { WeeklyPath } from '../types';
import { getCurrentWeekKey, getWeeklyPathDefinition } from '../config/weeklyPaths';
import { scheduleQuestReminders, cancelQuestReminders } from '../utils/notifications';

interface SettingsState {
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string;
  aiSkillsEnabled: boolean;
  fantasyNames: boolean;
  equippedTitleId: string;
  /** Unlocked equippable title ids (includes `custom:Label` campaign relics). */
  unlockedTitleIds: string[];
  /** Custom title labels keyed by custom id. */
  customTitleLabels: Record<string, string>;
  /** Achievement ids already celebrated. */
  seenAchievementIds: string[];
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
    unlockedTitleIds?: string[];
    customTitleLabels?: Record<string, string>;
    seenAchievementIds?: string[];
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
  unlockTitle: (titleId: string, customLabel?: string) => void;
  markAchievementsSeen: (ids: string[]) => void;
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
  | 'unlockedTitleIds'
  | 'customTitleLabels'
  | 'seenAchievementIds'
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
      unlockedTitleIds: state.unlockedTitleIds,
      customTitleLabels: state.customTitleLabels,
      seenAchievementIds: state.seenAchievementIds,
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

function refreshNotifications(enabled: boolean, reminderTime: string) {
  if (enabled) {
    void scheduleQuestReminders(reminderTime);
  } else {
    void cancelQuestReminders();
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      notificationsEnabled: true,
      hapticEnabled: true,
      reminderTime: '09:00',
      aiSkillsEnabled: false,
      fantasyNames: false,
      equippedTitleId: 'adventurer',
      unlockedTitleIds: ['adventurer'],
      customTitleLabels: {},
      seenAchievementIds: [],
      weeklyContractsCompleted: 0,
      weeklyPath: null,
      weeklyPathWeekKey: null,
      weeklyPathStartedAt: null,
      weeklyRewardWeekKey: null,
      weeklyRewardTitle: null,
      weeklyRewardBadge: null,
      replaceSettings: (settings) =>
        set({
          ...settings,
          unlockedTitleIds: settings.unlockedTitleIds ?? get().unlockedTitleIds,
          customTitleLabels: settings.customTitleLabels ?? get().customTitleLabels,
          seenAchievementIds: settings.seenAchievementIds ?? get().seenAchievementIds,
        }),

      toggleNotifications: () =>
        set((state) => {
          const next = { ...state, notificationsEnabled: !state.notificationsEnabled };
          syncSettings(next);
          refreshNotifications(next.notificationsEnabled, next.reminderTime);
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
          const next = { ...state, reminderTime: time };
          syncSettings(next);
          refreshNotifications(next.notificationsEnabled, time);
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

      unlockTitle: (titleId, customLabel) =>
        set((state) => {
          const unlockedTitleIds = state.unlockedTitleIds.includes(titleId)
            ? state.unlockedTitleIds
            : [...state.unlockedTitleIds, titleId];
          const customTitleLabels =
            customLabel && titleId.startsWith('custom:')
              ? { ...state.customTitleLabels, [titleId]: customLabel }
              : state.customTitleLabels;
          const next = { ...state, unlockedTitleIds, customTitleLabels };
          syncSettings(next);
          return { unlockedTitleIds, customTitleLabels };
        }),

      markAchievementsSeen: (ids) =>
        set((state) => {
          const seenAchievementIds = [...new Set([...state.seenAchievementIds, ...ids])];
          const next = { ...state, seenAchievementIds };
          syncSettings(next);
          return { seenAchievementIds };
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
          const path = state.weeklyPath;
          const pathDef = path ? getWeeklyPathDefinition(path) : null;

          // Map path reward titles to equippable ids
          const titleIdMap: Record<string, string> = {
            'Vanguard of Power': 'vanguard_power',
            'Sage of Focus': 'sage_of_focus',
            'Warden of Support': 'warden_support',
          };
          const titleId = titleIdMap[reward.title] ?? `custom:${reward.title}`;
          const unlockedTitleIds = state.unlockedTitleIds.includes(titleId)
            ? state.unlockedTitleIds
            : [...state.unlockedTitleIds, titleId];
          const customTitleLabels =
            titleId.startsWith('custom:')
              ? { ...state.customTitleLabels, [titleId]: reward.title }
              : state.customTitleLabels;

          const next = {
            ...state,
            weeklyRewardWeekKey: weekKey,
            weeklyRewardTitle: reward.title,
            weeklyRewardBadge: reward.badge,
            unlockedTitleIds,
            customTitleLabels,
            equippedTitleId: titleId,
            weeklyContractsCompleted: state.weeklyContractsCompleted + (pathDef ? 0 : 0),
          };
          console.info('[SettingsStore] Weekly reward claimed.', {
            weekKey,
            title: reward.title,
            badge: reward.badge,
            titleId,
          });
          syncSettings(next);
          return {
            weeklyRewardWeekKey: next.weeklyRewardWeekKey,
            weeklyRewardTitle: next.weeklyRewardTitle,
            weeklyRewardBadge: next.weeklyRewardBadge,
            unlockedTitleIds: next.unlockedTitleIds,
            customTitleLabels: next.customTitleLabels,
            equippedTitleId: next.equippedTitleId,
          };
        }),

      clearStaleWeeklyPath: () => {
        const state = get();
        if (!state.weeklyPathWeekKey || state.weeklyPathWeekKey === getCurrentWeekKey()) {
          return;
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
        set({
          weeklyPath: null,
          weeklyPathWeekKey: null,
          weeklyPathStartedAt: null,
          weeklyRewardWeekKey: null,
          weeklyRewardTitle: null,
          weeklyRewardBadge: null,
        });
      },
    }),
    {
      name: 'life-rpg-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.notificationsEnabled) {
          void scheduleQuestReminders(state.reminderTime);
        }
      },
    },
  ),
);
