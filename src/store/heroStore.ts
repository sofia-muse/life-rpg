import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { env } from '../config/env';
import { heroApi } from '../api/heroApi';
import { mapApiHero } from '../api/mappers';
import { useAuthStore } from './authStore';
import {
  Hero,
  HeroAppearance,
  CharacterAppearance,
  StatName,
  StatProgress,
  StatLevelUpResult,
  STAT_NAMES,
} from '../types';
import { calendarToday, deviceTimeZone } from '../engine/calendar';
import { applyXP, getStatDisplayProgress } from '../engine/xpEngine';
import { calculateHeroLevel, getStatBlock } from '../engine/statEngine';
import { checkClassEvolution, respecClassIdentity } from '../engine/classEngine';
import { getNewlyUnlockedSkills, getRestDayXpReward } from '../engine/skillEngine';
import { getClassName } from '../config/classes';
import { advanceTrackedStreak, isNewDay } from '../engine/streakEngine';
import { resolveRestDay } from '../engine/restDay';
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
  takeRestDay: (
    unlockedSkillIds: string[],
  ) => { granted: boolean; preservedStreak: boolean; xp: number } | null;
  respecClass: (stat: StatName) => void;
  setTimeZone: (timeZone: string) => void;
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

const today = () => calendarToday(useHeroStore.getState().hero?.timeZone || deviceTimeZone());

function isAuthoritative(): boolean {
  return !env.demoMode && useAuthStore.getState().status === 'authenticated';
}

function mergeCompletionLog(previous: Hero | null, next: Hero | null): Hero | null {
  if (!next) return null;
  if (next.completionLog) return next;
  if (previous?.id === next.id && previous.completionLog) {
    return { ...next, completionLog: previous.completionLog };
  }
  return next;
}

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

function applyHeroXp(
  hero: Hero,
  stat: StatName,
  amount: number,
  unlockedSkillIds: string[],
): { updatedHero: Hero; levelResult: StatLevelUpResult | null } {
  const result = applyXP(hero.statXP[stat], amount);
  const newStatXP = { ...hero.statXP, [stat]: result.newXP };
  const evolution = checkClassEvolution(newStatXP, hero.classTier, hero.className, hero.dominantStat);
  const newSkills = getNewlyUnlockedSkills(newStatXP, unlockedSkillIds);
  const timestamp = new Date().toISOString();

  const updatedHero: Hero = {
    ...hero,
    statXP: newStatXP,
    stats: getStatBlock(newStatXP),
    heroLevel: calculateHeroLevel(newStatXP),
    dominantStat: evolution ? evolution.dominantStat : hero.dominantStat,
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
        set((state) => ({
          hero: mergeCompletionLog(state.hero, hero),
          isOnboarded: options?.isOnboarded ?? !!hero,
        })),
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
          timeZone: deviceTimeZone(),
          recentRestDates: [],
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

        const advance = advanceTrackedStreak({
          currentStreak: hero.currentStreak,
          lastDate: hero.lastActiveDate,
          today: todayStr,
          unlockedSkillIds,
          lastStreakFreezeDate: hero.lastStreakFreezeDate,
          brokenDayCounts: true,
        });
        const newStreak = advance.streak;
        const usedStreakFreeze = advance.usedFreeze;
        const lastStreakFreezeDate = advance.lastStreakFreezeDate;

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
        if (!hero) return null;

        const decision = resolveRestDay({
          currentStreak: hero.currentStreak,
          longestStreak: hero.longestStreak,
          lastActiveDate: hero.lastActiveDate,
          lastStreakFreezeDate: hero.lastStreakFreezeDate,
          recentRestDates: hero.recentRestDates ?? [],
          restDaysUsed: hero.restDaysUsed,
          today: today(),
          vitalityLevel: levelFromXP(hero.statXP.vitality),
          unlockedSkillIds,
          baseRestXp: getRestDayXpReward(unlockedSkillIds),
        });
        if (!decision.granted) {
          return { granted: false, preservedStreak: false, xp: 0 };
        }

        const { updatedHero } = applyHeroXp(hero, 'vitality', decision.xp, unlockedSkillIds);
        const syncedHero: Hero = {
          ...updatedHero,
          currentStreak: decision.currentStreak,
          longestStreak: decision.longestStreak,
          lastActiveDate: decision.lastActiveDate,
          lastStreakFreezeDate: decision.lastStreakFreezeDate,
          recentRestDates: decision.recentRestDates,
          restDaysUsed: decision.restDaysUsed,
        };

        set({ hero: syncedHero });
        if (isAuthoritative()) {
          void heroApi.takeRest().then((apiHero) => {
            set({ hero: mapApiHero(apiHero) });
          }).catch(() => syncHeroState(syncedHero));
        } else {
          syncHeroState(syncedHero);
        }
        return { granted: true, preservedStreak: decision.preservedStreak, xp: decision.xp };
      },

      respecClass: (stat) => {
        const { hero } = get();
        if (!hero) return;
        const identity = respecClassIdentity(stat, hero.classTier);
        const updatedHero: Hero = {
          ...hero,
          dominantStat: identity.dominantStat,
          className: identity.className,
          updatedAt: new Date().toISOString(),
        };
        set({ hero: updatedHero });
        if (isAuthoritative()) {
          void heroApi.respec(stat).then((apiHero) => {
            set({ hero: mapApiHero(apiHero) });
          }).catch(() => syncHeroState(updatedHero));
        } else {
          syncHeroState(updatedHero);
        }
      },

      setTimeZone: (timeZone) => {
        const { hero } = get();
        const zone = timeZone.trim() || deviceTimeZone();
        if (!hero) return;
        const updatedHero: Hero = {
          ...hero,
          timeZone: zone,
          updatedAt: new Date().toISOString(),
        };
        set({ hero: updatedHero });
        syncHeroState(updatedHero);
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
        if (state?.hero && !state.hero.timeZone) {
          state.hero.timeZone = deviceTimeZone();
        }
        if (state?.hero && !state.hero.recentRestDates) {
          state.hero.recentRestDates = [];
        }
        useHeroStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
