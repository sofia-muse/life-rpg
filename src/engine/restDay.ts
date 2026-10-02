import { daysBetween } from './calendar';
import {
  getRestDayAllowance,
  getStreakRetentionRatio,
  getWeeklyStreakFreezeAllowance,
} from './skillEngine';
import { getStreakAfterBreak, isNewDay, shouldResetStreak } from './streakEngine';

export const REST_WINDOW_DAYS = 7;

export interface RestDayInput {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  lastStreakFreezeDate?: string;
  recentRestDates: string[];
  restDaysUsed: number;
  today: string;
  vitalityLevel: number;
  unlockedSkillIds: string[];
  baseRestXp: number;
}

export interface RestDayDecision {
  granted: boolean;
  preservedStreak: boolean;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  lastStreakFreezeDate?: string;
  recentRestDates: string[];
  restDaysUsed: number;
  usedStreakFreeze: boolean;
}

function restsInWindow(dates: string[], today: string): number {
  return dates.filter((date) => {
    const gap = daysBetween(date, today);
    return gap !== null && gap >= 0 && gap < REST_WINDOW_DAYS;
  }).length;
}

/**
 * One rest inside the weekly allowance counts as showing up: the hero streak continues
 * and vitality XP scales with the vitality level. A second rest in the window does nothing.
 */
export function resolveRestDay(input: RestDayInput): RestDayDecision {
  const recent = input.recentRestDates.filter((date) => {
    const gap = daysBetween(date, input.today);
    return gap !== null && gap >= 0 && gap < REST_WINDOW_DAYS;
  });
  const unchanged: RestDayDecision = {
    granted: false,
    preservedStreak: false,
    xp: 0,
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
    lastActiveDate: input.lastActiveDate,
    lastStreakFreezeDate: input.lastStreakFreezeDate,
    recentRestDates: recent,
    restDaysUsed: input.restDaysUsed,
    usedStreakFreeze: false,
  };

  if (recent.includes(input.today)) return unchanged;
  if (restsInWindow(recent, input.today) >= getRestDayAllowance(input.unlockedSkillIds)) {
    return unchanged;
  }

  const streak = continueStreak(input);
  return {
    granted: true,
    preservedStreak: true,
    xp: input.baseRestXp + Math.max(0, Math.floor(input.vitalityLevel)),
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    lastStreakFreezeDate: streak.lastStreakFreezeDate,
    recentRestDates: [...recent, input.today],
    restDaysUsed: input.restDaysUsed + 1,
    usedStreakFreeze: streak.usedStreakFreeze,
  };
}

function wasUsedRecently(lastUsedDate: string | undefined, today: string, days: number): boolean {
  if (!lastUsedDate) return false;
  const gap = daysBetween(lastUsedDate, today);
  if (gap === null) return false;
  return gap >= 0 && gap < days;
}

function continueStreak(input: RestDayInput): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  lastStreakFreezeDate?: string;
  usedStreakFreeze: boolean;
} {
  if (!input.lastActiveDate) {
    return {
      currentStreak: Math.max(input.currentStreak, 1),
      longestStreak: Math.max(input.longestStreak, Math.max(input.currentStreak, 1)),
      lastActiveDate: input.today,
      lastStreakFreezeDate: input.lastStreakFreezeDate,
      usedStreakFreeze: false,
    };
  }

  if (!isNewDay(input.lastActiveDate, input.today)) {
    const currentStreak = Math.max(input.currentStreak, 1);
    return {
      currentStreak,
      longestStreak: Math.max(input.longestStreak, currentStreak),
      lastActiveDate: input.lastActiveDate,
      lastStreakFreezeDate: input.lastStreakFreezeDate,
      usedStreakFreeze: false,
    };
  }

  let newStreak = input.currentStreak;
  let usedStreakFreeze = false;
  let lastStreakFreezeDate = input.lastStreakFreezeDate;

  if (shouldResetStreak(input.lastActiveDate, input.today)) {
    const allowance = getWeeklyStreakFreezeAllowance(input.unlockedSkillIds);
    if (allowance > 0 && !wasUsedRecently(input.lastStreakFreezeDate, input.today, REST_WINDOW_DAYS)) {
      usedStreakFreeze = true;
      lastStreakFreezeDate = input.today;
    } else {
      const retention = getStreakRetentionRatio(input.unlockedSkillIds);
      newStreak =
        retention > 0
          ? Math.floor(input.currentStreak * retention)
          : getStreakAfterBreak(input.currentStreak, false);
    }
  } else {
    newStreak = input.currentStreak + 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(input.longestStreak, newStreak),
    lastActiveDate: input.today,
    lastStreakFreezeDate,
    usedStreakFreeze,
  };
}
