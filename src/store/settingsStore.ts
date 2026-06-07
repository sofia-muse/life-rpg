import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string;
  aiSkillsEnabled: boolean;
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

      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      toggleHaptic: () => set((state) => ({ hapticEnabled: !state.hapticEnabled })),

      setReminderTime: (time) => set({ reminderTime: time }),

      toggleAiSkills: () => set((state) => ({ aiSkillsEnabled: !state.aiSkillsEnabled })),
    }),
    {
      name: 'life-rpg-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
