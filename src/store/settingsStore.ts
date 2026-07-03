import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from '../api/syncManager';

interface SettingsState {
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string;
  aiSkillsEnabled: boolean;
  replaceSettings: (settings: {
    notificationsEnabled: boolean;
    hapticEnabled: boolean;
    reminderTime: string;
    aiSkillsEnabled: boolean;
  }) => void;
  toggleNotifications: () => void;
  toggleHaptic: () => void;
  setReminderTime: (time: string) => void;
  toggleAiSkills: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      hapticEnabled: true,
      reminderTime: '09:00',
      aiSkillsEnabled: false,
      replaceSettings: (settings) => set(settings),

      toggleNotifications: () =>
        set((state) => {
          const next = { ...state, notificationsEnabled: !state.notificationsEnabled };
          syncManager.enqueue('hero', 'upsert', {
            settings: {
              notificationsEnabled: next.notificationsEnabled,
              hapticEnabled: next.hapticEnabled,
              reminderTime: next.reminderTime,
              aiSkillsEnabled: next.aiSkillsEnabled,
            },
            updatedAt: new Date().toISOString(),
          });
          return { notificationsEnabled: next.notificationsEnabled };
        }),

      toggleHaptic: () =>
        set((state) => {
          const next = { ...state, hapticEnabled: !state.hapticEnabled };
          syncManager.enqueue('hero', 'upsert', {
            settings: {
              notificationsEnabled: next.notificationsEnabled,
              hapticEnabled: next.hapticEnabled,
              reminderTime: next.reminderTime,
              aiSkillsEnabled: next.aiSkillsEnabled,
            },
            updatedAt: new Date().toISOString(),
          });
          return { hapticEnabled: next.hapticEnabled };
        }),

      setReminderTime: (time) =>
        set((state) => {
          syncManager.enqueue('hero', 'upsert', {
            settings: {
              notificationsEnabled: state.notificationsEnabled,
              hapticEnabled: state.hapticEnabled,
              reminderTime: time,
              aiSkillsEnabled: state.aiSkillsEnabled,
            },
            updatedAt: new Date().toISOString(),
          });
          return { reminderTime: time };
        }),

      toggleAiSkills: () =>
        set((state) => {
          const next = { ...state, aiSkillsEnabled: !state.aiSkillsEnabled };
          syncManager.enqueue('hero', 'upsert', {
            settings: {
              notificationsEnabled: next.notificationsEnabled,
              hapticEnabled: next.hapticEnabled,
              reminderTime: next.reminderTime,
              aiSkillsEnabled: next.aiSkillsEnabled,
            },
            updatedAt: new Date().toISOString(),
          });
          return { aiSkillsEnabled: next.aiSkillsEnabled };
        }),
    }),
    {
      name: 'life-rpg-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
