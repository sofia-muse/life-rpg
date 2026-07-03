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
import { applyXP, getStatDisplayProgress } from '../engine/xpEngine';
import { calculateHeroLevel, getDominantStat, getStatBlock } from '../engine/statEngine';
import { checkClassEvolution } from '../engine/classEngine';
import {
  getNewlyUnlockedSkills,
  getRestDayXpReward,
  getStreakRetentionRatio,
  getWeeklyStreakFreezeAllowance,
} from '../engine/skillEngine';
import { getClassName } from '../config/classes';
import { shouldResetStreak, isNewDay, getStreakAfterBreak } from '../engine/streakEngine';
import {
  getDefaultAppearance,
  getDefaultCharacterAppearance,
  computeUnlockedItems,
} from '../config/appearanceConfig';
import { levelFromXP } from '../config/xpTables';
import { syncManager } from '../api/syncManager';

interface HeroState {
  hero: Hero | null;
  isOnboarded: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setHero: (hero: Hero | null, options?: { isOnboarded?: boolean }) => void;
  clearHero: () => void;
  createHero: (
    name: string,
    avatarSeed: string,
    focusStats: StatName[],
    charAppearance?: CharacterAppearance,
  ) => void;
  addXP: (stat: StatName, amount: number) => StatLevelUpResult | null;
  applyQuestReward: (stat: StatName, amount: number, unlockedSkillIds: string[]) => {
    hero: Hero;
    levelResult: StatLevelUpResult | null;
  } | null;
  recordQuestCompletion: () => void;
  updateStreak: (unlockedSkillIds: string[]) => { usedStreakFreeze: boolean; rewardAvailable: boolean } | null;
  takeRestDay: (unlockedSkillIds: string[]) => void;
  getStatProgress: (stat: StatName) => StatProgress;
  updateAppearance: (
    patch: Partial<
      Pick<HeroAppearance, 'crestShape' | 'sigil' | 'accentOverride' | 'titleDisplay'>
    >,
  ) => void;
  checkAppearanceUnlocks: () => { shapes: string[]; sigils: string[] } | null;
  updateCharacterAppearance: (patch: Partial<CharacterAppearance>) => void;
  getDailyRewardPreview: () => { xp: number; stat: StatName; bonusType: string } | null;
  claimDailyReward: (unlockedSkillIds: string[]) => {
    reward: { xp: number; stat: StatName; bonusType: string };
    levelResult: StatLevelUpResult | null;
  } | null;
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

const freezeCooldownDays = 7;

function getDailyRewardForHero(hero: Hero): { xp: number; stat: StatName; bonusType: string } | null {
  const todayStr = today();
  if (hero.lastRewardDate === todayStr) return null;

  const loginDays = (hero.totalLoginDays || 0) + 1;
  const streak = hero.currentStreak;

  let baseXP = Math.min(5 + loginDays, 25);
  let bonusType = 'Daily Login';

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

  return {
    xp: baseXP,
    stat: hero.dominantStat,
    bonusType,
  };
}

function wasUsedRecently(lastUsedDate: string | undefined, days: number): boolean {
  if (!lastUsedDate) return false;

  const last = new Date(lastUsedDate);
  const now = new Date(today());
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays < days;
}

function applyHeroXp(
  hero: Hero,
  stat: StatName,
  amount: number,
  unlockedSkillIds: string[],
): { updatedHero: Hero; levelResult: StatLevelUpResult | null } {
  const result = applyXP(hero.statXP[stat], amount);
  const newStatXP = { ...hero.statXP, [stat]: result.newXP };
  const evolution = checkClassEvolution(newStatXP, hero.classTier, hero.className);
  const newSkills = getNewlyUnlockedSkills(newStatXP, unlockedSkillIds);
  const timestamp = new Date().toISOString();

  const updatedHero: Hero = {
    ...hero,
    statXP: newStatXP,
    stats: getStatBlock(newStatXP),
    heroLevel: calculateHeroLevel(newStatXP),
    dominantStat: getDominantStat(newStatXP),
    className: evolution ? evolution.newClass : hero.className,
    classTier: evolution ? evolution.newTier : hero.classTier,
    lastActiveDate: today(),
    updatedAt: timestamp,
  };

  return {
    updatedHero,
    levelResult: result.didLevelUp
      ? {
          stat,
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
          newSkills,
          tierUp: evolution ? { newTier: evolution.newTier, newClass: evolution.newClass } : undefined,
        }
      : null,
  };
}

function syncHeroState(hero: Hero): void {
  syncManager.enqueue('hero', 'upsert', hero);
}

export const useHeroStore = create<HeroState>()(
  persist(
    (set, get) => ({
      hero: null,
      isOnboarded: false,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
      setHero: (hero, options) =>
        set({
          hero,
          isOnboarded: options?.isOnboarded ?? !!hero,
        }),
      clearHero: () => set({ hero: null, isOnboarded: false }),

      createHero: (name, avatarSeed, focusStats, charAppearance) => {
        const statXP = createEmptyStatXP();
        for (const stat of focusStats) {
          statXP[stat] = 50;
        }
        const dominantStat = focusStats[0] || 'strength';
        const timestamp = new Date().toISOString();
        const hero: Hero = {
          id: generateId(),
          name,
          avatarSeed,
          createdAt: timestamp,
          updatedAt: timestamp,
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
          lastStreakFreezeDate: undefined,
        };
        set({ hero, isOnboarded: true });
      },

      addXP: (stat, amount) => {
        const { hero } = get();
        if (!hero) return null;

        const { updatedHero, levelResult } = applyHeroXp(hero, stat, amount, []);
        set({ hero: updatedHero });
        return levelResult;
      },

      applyQuestReward: (stat, amount, unlockedSkillIds) => {
        const { hero } = get();
        if (!hero) return null;

        const { updatedHero, levelResult } = applyHeroXp(hero, stat, amount, unlockedSkillIds);
        set({
          hero: {
            ...updatedHero,
            totalQuestsCompleted: hero.totalQuestsCompleted + 1,
          },
        });

        return {
          hero: {
            ...updatedHero,
            totalQuestsCompleted: hero.totalQuestsCompleted + 1,
          },
          levelResult,
        };
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

      updateStreak: (unlockedSkillIds) => {
        const { hero } = get();
        if (!hero) return null;

        const todayStr = today();
        if (!hero.lastActiveDate) {
          const updatedHero: Hero = {
            ...hero,
            lastActiveDate: todayStr,
            updatedAt: new Date().toISOString(),
          };
          set({ hero: updatedHero });
          syncHeroState(updatedHero);
          return { usedStreakFreeze: false, rewardAvailable: getDailyRewardForHero(updatedHero) !== null };
        }
        if (!isNewDay(hero.lastActiveDate, todayStr)) {
          return { usedStreakFreeze: false, rewardAvailable: getDailyRewardForHero(hero) !== null };
        }

        const streakBroken = shouldResetStreak(hero.lastActiveDate, todayStr);
        let newStreak = hero.currentStreak;
        let usedStreakFreeze = false;
        let lastStreakFreezeDate = hero.lastStreakFreezeDate;

        if (streakBroken) {
          const streakFreezeAllowance = getWeeklyStreakFreezeAllowance(unlockedSkillIds);
          const canUseFreeze =
            streakFreezeAllowance > 0 && !wasUsedRecently(hero.lastStreakFreezeDate, freezeCooldownDays);

          if (canUseFreeze) {
            usedStreakFreeze = true;
            lastStreakFreezeDate = todayStr;
          } else {
            const retentionRatio = getStreakRetentionRatio(unlockedSkillIds);
            newStreak =
              retentionRatio > 0
                ? Math.floor(hero.currentStreak * retentionRatio)
                : getStreakAfterBreak(hero.currentStreak, false);
          }
        } else {
          newStreak = hero.currentStreak + 1;
        }

        const updatedHero: Hero = {
          ...hero,
          currentStreak: newStreak,
          longestStreak: Math.max(hero.longestStreak, newStreak),
          lastActiveDate: todayStr,
          lastStreakFreezeDate,
          updatedAt: new Date().toISOString(),
        };

        set({ hero: updatedHero });
        syncHeroState(updatedHero);

        return {
          usedStreakFreeze,
          rewardAvailable: getDailyRewardForHero(updatedHero) !== null,
        };
      },

      takeRestDay: (unlockedSkillIds) => {
        const { hero } = get();
        if (!hero) return;

        const restXP = getRestDayXpReward(unlockedSkillIds);
        const { updatedHero } = applyHeroXp(hero, 'vitality', restXP, unlockedSkillIds);
        const syncedHero: Hero = {
          ...updatedHero,
          restDaysUsed: hero.restDaysUsed + 1,
        };

        set({
          hero: syncedHero,
        });
        syncHeroState(syncedHero);
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
        const updatedHero: Hero = {
          ...hero,
          appearance: { ...hero.appearance, ...patch },
          updatedAt: new Date().toISOString(),
        };
        set({
          hero: updatedHero,
        });
        syncManager.enqueue('hero', 'upsert', {
          appearance: updatedHero.appearance,
          updatedAt: updatedHero.updatedAt,
        });
      },

      updateCharacterAppearance: (patch) => {
        const { hero } = get();
        if (!hero) return;
        const updatedHero: Hero = {
          ...hero,
          characterAppearance: { ...hero.characterAppearance, ...patch },
          updatedAt: new Date().toISOString(),
        };
        set({
          hero: updatedHero,
        });
        syncManager.enqueue('hero', 'upsert', {
          characterAppearance: updatedHero.characterAppearance,
          updatedAt: updatedHero.updatedAt,
        });
      },

      getDailyRewardPreview: () => {
        const { hero } = get();
        if (!hero) return null;
        return getDailyRewardForHero(hero);
      },

      claimDailyReward: (unlockedSkillIds) => {
        const { hero } = get();
        if (!hero) return null;

        const reward = getDailyRewardForHero(hero);
        if (!reward) return null;

        const { updatedHero, levelResult } = applyHeroXp(hero, reward.stat, reward.xp, unlockedSkillIds);
        set({
          hero: {
            ...updatedHero,
            lastRewardDate: today(),
            totalLoginDays: (hero.totalLoginDays || 0) + 1,
          },
        });
        syncHeroState(get().hero!);

        return { reward, levelResult };
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
