import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skill, StatName, STAT_NAMES } from '../types';
import { ForgedSkillDto, skillApi } from '../api/skillApi';
import { registerForgedSkills } from '../config/skills';
import { getDemoForgedSkills } from '../config/demoForgedSkills';
import { env } from '../config/env';

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
    requiredLevel: 0,
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

function mergeRegistered(skills: Skill[]) {
  const demo = getDemoForgedSkills();
  const byId = new Map<string, Skill>();
  for (const skill of [...demo, ...skills]) {
    byId.set(skill.id, skill);
  }
  const merged = [...byId.values()];
  registerForgedSkills(merged);
  return merged;
}

interface ForgedSkillState {
  forged: Skill[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  forge: () => Promise<Skill | null>;
  seedDemo: () => void;
  clear: () => void;
}

export const useForgedSkillStore = create<ForgedSkillState>()(
  persist(
    (set, get) => ({
      forged: [],
      loading: false,
      error: null,

      seedDemo: () => {
        if (!env.demoMode) return;
        const real = get().forged.filter((s) => !s.id.startsWith('demo-forge-'));
        set({ forged: mergeRegistered(real) });
      },

      load: async () => {
        try {
          if (env.demoMode) {
            set({ forged: mergeRegistered([]) });
            return;
          }
          const dtos = await skillApi.listForged();
          set({ forged: mergeRegistered(dtos.map(toSkill)), error: null });
        } catch (e) {
          if (env.demoMode) {
            set({ forged: mergeRegistered([]) });
          }
          set({ error: e instanceof Error ? e.message : 'Failed to load forged skills' });
        }
      },

      forge: async () => {
        set({ loading: true, error: null });
        try {
          const skill = toSkill(await skillApi.forge());
          const next = mergeRegistered([
            skill,
            ...get().forged.filter((s) => s.id !== skill.id && !s.id.startsWith('demo-forge-')),
          ]);
          set({ forged: next, loading: false });
          return skill;
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Forge failed' });
          return null;
        }
      },

      clear: () => {
        set({ forged: [], loading: false, error: null });
        registerForgedSkills(env.demoMode ? getDemoForgedSkills() : []);
      },
    }),
    {
      name: 'life-rpg-forged-skills',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (env.demoMode) {
          state?.seedDemo();
        } else if (state?.forged?.length) {
          registerForgedSkills(state.forged);
        }
      },
    },
  ),
);
