import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skill, StatName, STAT_NAMES } from '../types';
import { ForgedSkillDto, skillApi } from '../api/skillApi';
import { registerForgedSkills } from '../config/skills';

function toSkill(dto: ForgedSkillDto): Skill {
  const stat = (STAT_NAMES as string[]).includes(dto.category)
    ? (dto.category as StatName)
    : undefined;
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    category: (stat ?? 'cross') as Skill['category'],
    requiredStat: stat,
    requiredLevel: 0, // forged skills are immediately active
    icon: dto.icon,
    effect: dto.effect,
    effects: stat
      ? [
          {
            type: 'questXpBonus',
            percent: Number.parseInt(dto.effect.match(/\+(\d+)%/)?.[1] ?? '0', 10),
            stats: [stat],
          },
        ]
      : [{ type: 'displayText', text: dto.effect }],
  };
}

interface ForgedSkillState {
  forged: Skill[];
  loading: boolean;
  error: string | null;
  /** Pull the hero's forged skills from the backend and register them for bonus resolution. */
  load: () => Promise<void>;
  /** Forge one new skill; returns it (or null on failure). */
  forge: () => Promise<Skill | null>;
  clear: () => void;
}

export const useForgedSkillStore = create<ForgedSkillState>()(
  persist(
    (set, get) => ({
      forged: [],
      loading: false,
      error: null,

      load: async () => {
        try {
          const dtos = await skillApi.listForged();
          const skills = dtos.map(toSkill);
          set({ forged: skills });
          registerForgedSkills(skills);
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to load forged skills' });
        }
      },

      forge: async () => {
        set({ loading: true, error: null });
        try {
          const skill = toSkill(await skillApi.forge());
          const next = [skill, ...get().forged];
          set({ forged: next, loading: false });
          registerForgedSkills(next);
          return skill;
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Forge failed' });
          return null;
        }
      },

      clear: () => {
        set({ forged: [], loading: false, error: null });
        registerForgedSkills([]);
      },
    }),
    {
      name: 'life-rpg-forged-skills',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Re-register persisted forged skills so XP bonuses resolve after a cold start.
        if (state?.forged?.length) registerForgedSkills(state.forged);
      },
    },
  ),
);
