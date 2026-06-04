import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skill, StatName, UnlockedSkill } from '../types';
import { getNewlyUnlockedSkills } from '../engine/skillEngine';

interface SkillState {
  unlockedSkills: UnlockedSkill[];
  checkAndUnlockSkills: (statXP: Record<StatName, number>) => Skill[];
  isSkillUnlocked: (skillId: string) => boolean;
  getUnlockedSkillIds: () => string[];
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      unlockedSkills: [],

      checkAndUnlockSkills: (statXP) => {
        const alreadyUnlocked = get().unlockedSkills.map((s) => s.skillId);
        const newSkills = getNewlyUnlockedSkills(statXP, alreadyUnlocked);

        if (newSkills.length > 0) {
          const newEntries: UnlockedSkill[] = newSkills.map((skill) => ({
            skillId: skill.id,
            unlockedAt: new Date().toISOString(),
          }));

          set((state) => ({
            unlockedSkills: [...state.unlockedSkills, ...newEntries],
          }));
        }

        return newSkills;
      },

      isSkillUnlocked: (skillId) => {
        return get().unlockedSkills.some((s) => s.skillId === skillId);
      },

      getUnlockedSkillIds: () => {
        return get().unlockedSkills.map((s) => s.skillId);
      },
    }),
    {
      name: 'life-rpg-skills',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
