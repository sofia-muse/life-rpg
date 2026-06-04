import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import {
  Hero,
  HeroAppearance,
  CharacterAppearance,
  StatName,
  StatProgress,
  StatLevelUpResult,
  STAT_NAMES,
} from '../types';
import { applyXP, getStatDisplayProgress, getRestDayXP } from '../engine/xpEngine';
import { calculateHeroLevel, getDominantStat, getStatBlock } from '../engine/statEngine';
import { checkClassEvolution } from '../engine/classEngine';
import { getNewlyUnlockedSkills } from '../engine/skillEngine';
import { getClassName } from '../config/classes';
import { shouldResetStreak, isNewDay, getStreakAfterBreak } from '../engine/streakEngine';
import {
  getDefaultAppearance,
  getDefaultCharacterAppearance,
  computeUnlockedItems,
} from '../config/appearanceConfig';
import { levelFromXP } from '../config/xpTables';

interface HeroState {
  hero: Hero | null;
  isOnboarded: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  createHero: (
    name: string,
    avatarSeed: string,
    focusStats: StatName[],
    charAppearance?: CharacterAppearance,
  ) => void;
  addXP: (stat: StatName, amount: number) => StatLevelUpResult | null;
  recordQuestCompletion: () => void;
  updateStreak: () => void;
  takeRestDay: () => void;
  getStatProgress: (stat: StatName) => StatProgress;
  updateAppearance: (
    patch: Partial<
      Pick<HeroAppearance, 'crestShape' | 'sigil' | 'accentOverride' | 'titleDisplay'>
    >,
  ) => void;
  checkAppearanceUnlocks: () => { shapes: string[]; sigils: string[] } | null;
  updateCharacterAppearance: (patch: Partial<CharacterAppearance>) => void;
  claimDailyReward: () => { xp: number; stat: StatName; bonusType: string } | null;
}

const createEmptyStatXP = (): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
});

const today = () => new Date().toISOString().split('T')[0];

export const useHeroStore = create<HeroState>()(
  persist(
    (set, get) => ({
      hero: null,
      isOnboarded: false,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      createHero: (name, avatarSeed, focusStats, charAppearance) => {
        const statXP = createEmptyStatXP();
        for (const stat of focusStats) {
          statXP[stat] = 50;
        }
        const dominantStat = focusStats[0] || 'strength';
        const hero: Hero = {
          id: generateId(),
          name,
          avatarSeed,
          createdAt: new Date().toISOString(),
          stats: getStatBlock(statXP),
          statXP,
          heroLevel: 1,
          className: getClassName(dominantStat, 1),
          classTier: 1,
          dominantStat,
          totalQuestsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: today(),
          restDaysUsed: 0,
          appearance: getDefaultAppearance(),
          characterAppearance: charAppearance || getDefaultCharacterAppearance(),
          lastRewardDate: '',
          totalLoginDays: 0,
        };
        set({ hero, isOnboarded: true });
      },

      addXP: (stat, amount) => {
        const { hero } = get();
        if (!hero) return null;

        const result = applyXP(hero.statXP[stat], amount);
        const newStatXP = { ...hero.statXP, [stat]: result.newXP };
        const newStats = getStatBlock(newStatXP);
        const newHeroLevel = calculateHeroLevel(newStatXP);
        const newDominantStat = getDominantStat(newStatXP);

        const evolution = checkClassEvolution(newStatXP, hero.classTier, hero.className);

        const unlockedSkillIds: string[] = [];
        const newSkills = getNewlyUnlockedSkills(newStatXP, unlockedSkillIds);

        const updatedHero: Hero = {
          ...hero,
          statXP: newStatXP,
          stats: newStats,
          heroLevel: newHeroLevel,
          dominantStat: newDominantStat,
          className: evolution ? evolution.newClass : hero.className,
          classTier: evolution ? evolution.newTier : hero.classTier,
          lastActiveDate: today(),
        };

        set({ hero: updatedHero });

        if (result.didLevelUp) {
          return {
            stat,
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
            newSkills,
            tierUp: evolution
              ? { newTier: evolution.newTier, newClass: evolution.newClass }
              : undefined,
          };
        }
        return null;
      },

      recordQuestCompletion: () => {
        const { hero } = get();
        if (!hero) return;
        set({
          hero: {
            ...hero,
            totalQuestsCompleted: hero.totalQuestsCompleted + 1,
          },
        });
      },

      updateStreak: () => {
        const { hero } = get();
        if (!hero) return;

        const todayStr = today();
        if (!isNewDay(hero.lastActiveDate, todayStr)) return;

        const streakBroken = shouldResetStreak(hero.lastActiveDate, todayStr);
        let newStreak = hero.currentStreak;

        if (streakBroken) {
          newStreak = getStreakAfterBreak(hero.currentStreak, false);
        } else {
          newStreak = hero.currentStreak + 1;
        }

        set({
          hero: {
            ...hero,
            currentStreak: newStreak,
            longestStreak: Math.max(hero.longestStreak, newStreak),
            lastActiveDate: todayStr,
          },
        });
      },

      takeRestDay: () => {
        const { hero } = get();
        if (!hero) return;

        const restXP = getRestDayXP(false);
        const result = applyXP(hero.statXP.vitality, restXP);
        const newStatXP = { ...hero.statXP, vitality: result.newXP };

        set({
          hero: {
            ...hero,
            statXP: newStatXP,
            stats: getStatBlock(newStatXP),
            restDaysUsed: hero.restDaysUsed + 1,
            lastActiveDate: today(),
          },
        });
      },

      getStatProgress: (stat) => {
        const { hero } = get();
        if (!hero) return { stat, currentXP: 0, level: 0, xpToNextLevel: 100 };

        const display = getStatDisplayProgress(hero.statXP[stat]);
        return {
          stat,
          currentXP: display.currentXP,
          level: display.level,
          xpToNextLevel: display.xpNeeded,
        };
      },

      updateAppearance: (patch) => {
        const { hero } = get();
        if (!hero) return;
        set({
          hero: {
            ...hero,
            appearance: { ...hero.appearance, ...patch },
          },
        });
      },

      updateCharacterAppearance: (patch) => {
        const { hero } = get();
        if (!hero) return;
        set({
          hero: {
            ...hero,
            characterAppearance: { ...hero.characterAppearance, ...patch },
          },
        });
      },

      claimDailyReward: () => {
        const { hero } = get();
        if (!hero) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        if (hero.lastRewardDate === todayStr) return null; // Already claimed

        const loginDays = (hero.totalLoginDays || 0) + 1;
        const streak = hero.currentStreak;

        // Base XP scales with login days (5 + 1 per day, max 25)
        let baseXP = Math.min(5 + loginDays, 25);
        let bonusType = 'Daily Login';

        // Streak milestones give bonus
        if (streak >= 30) {
          baseXP += 50;
          bonusType = '30-Day Streak Bonus!';
        } else if (streak >= 14) {
          baseXP += 25;
          bonusType = '2-Week Streak Bonus!';
        } else if (streak >= 7) {
          baseXP += 15;
          bonusType = 'Weekly Streak Bonus!';
        } else if (streak >= 3) {
          baseXP += 5;
          bonusType = 'Streak Bonus';
        }

        // Apply to dominant stat
        const stat = hero.dominantStat;

        set({
          hero: {
            ...hero,
            lastRewardDate: todayStr,
            totalLoginDays: loginDays,
          },
        });

        return { xp: baseXP, stat, bonusType };
      },

      checkAppearanceUnlocks: () => {
        const { hero } = get();
        if (!hero) return null;

        const statLevels = {} as Record<StatName, number>;
        for (const stat of STAT_NAMES) {
          statLevels[stat] = levelFromXP(hero.statXP[stat]);
        }

        const { shapes, sigils } = computeUnlockedItems(statLevels, hero.heroLevel);
        const currentAppearance = hero.appearance;

        const newShapes = shapes.filter((s) => !currentAppearance.unlockedCrestShapes.includes(s));
        const newSigils = sigils.filter((s) => !currentAppearance.unlockedSigils.includes(s));

        if (newShapes.length === 0 && newSigils.length === 0) return null;

        set({
          hero: {
            ...hero,
            appearance: {
              ...currentAppearance,
              unlockedCrestShapes: [
                ...new Set([...currentAppearance.unlockedCrestShapes, ...shapes]),
              ],
              unlockedSigils: [...new Set([...currentAppearance.unlockedSigils, ...sigils])],
            },
          },
        });

        return {
          shapes: newShapes,
          sigils: newSigils,
        };
      },
    }),
    {
      name: 'life-rpg-hero',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Migration: add defaults for existing heroes
        if (state?.hero && !state.hero.appearance) {
          state.hero.appearance = getDefaultAppearance();
        }
        if (state?.hero && !state.hero.characterAppearance) {
          state.hero.characterAppearance = getDefaultCharacterAppearance();
        }
        if (state?.hero && state.hero.lastRewardDate === undefined) {
          state.hero.lastRewardDate = '';
          state.hero.totalLoginDays = 0;
        }
        useHeroStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
