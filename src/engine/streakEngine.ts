import { StreakMilestone } from '../types';
import { daysBetween } from './calendar';
import { getStreakRetentionRatio, getWeeklyStreakFreezeAllowance } from './skillEngine';

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, multiplier: 1.1, title: 'Getting Started' },
  { days: 7, multiplier: 1.2, title: 'One Week Strong' },
  { days: 14, multiplier: 1.3, title: 'Two Weeks!' },
  { days: 30, multiplier: 1.5, title: 'Monthly Master' },
  { days: 60, multiplier: 1.7, title: 'Iron Habit' },
  { days: 90, multiplier: 2.0, title: 'Legendary Streak' },
  { days: 180, multiplier: 2.5, title: 'Half-Year Hero' },
  { days: 365, multiplier: 3.0, title: 'Yearly Legend' },
];

/**
 * Hero-wide streak bonus. Caps at 1.5 so a long life-streak cannot triple every quest.
 * The habit itself uses {@link getStreakMultiplier} on that quest's own streak.
 */
export const HERO_STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, multiplier: 1.05, title: 'Getting Started' },
  { days: 7, multiplier: 1.1, title: 'One Week Strong' },
  { days: 14, multiplier: 1.15, title: 'Two Weeks!' },
  { days: 30, multiplier: 1.2, title: 'Monthly Master' },
  { days: 60, multiplier: 1.25, title: 'Iron Habit' },
  { days: 90, multiplier: 1.35, title: 'Legendary Streak' },
  { days: 180, multiplier: 1.4, title: 'Half-Year Hero' },
  { days: 365, multiplier: 1.5, title: 'Yearly Legend' },
];

function multiplierFor(streakDays: number, milestones: StreakMilestone[]): number {
  let multiplier = 1.0;
  for (const milestone of milestones) {
    if (streakDays >= milestone.days) {
      multiplier = milestone.multiplier;
    }
  }
  return multiplier;
}

/** Quest-local streak multiplier (dailies). Climbs to 3.0 at a year of that habit. */
export function getStreakMultiplier(streakDays: number): number {
  return multiplierFor(streakDays, STREAK_MILESTONES);
}

/** Small bonus for showing up at all. Caps at 1.5. */
export function getHeroStreakMultiplier(streakDays: number): number {
  return multiplierFor(streakDays, HERO_STREAK_MILESTONES);
}

export function getNextMilestone(
  streakDays: number,
  milestones: StreakMilestone[] = STREAK_MILESTONES,
): StreakMilestone | null {
  for (const milestone of milestones) {
    if (streakDays < milestone.days) {
      return milestone;
    }
  }
  return null;
}

export function getCurrentMilestone(
  streakDays: number,
  milestones: StreakMilestone[] = STREAK_MILESTONES,
): StreakMilestone | null {
  let current: StreakMilestone | null = null;
  for (const milestone of milestones) {
    if (streakDays >= milestone.days) {
      current = milestone;
    }
  }
  return current;
}

/** True when more than one calendar day was missed. Dates are YYYY-MM-DD in the hero's zone. */
export function shouldResetStreak(lastActiveDate: string, today: string): boolean {
  const gap = daysBetween(lastActiveDate, today);
  if (gap === null) return false;
  return gap > 1;
}

// Check if it's a new day since last active
export function isNewDay(lastActiveDate: string, today: string): boolean {
  return lastActiveDate !== today;
}

// Calculate streak after a break (with Regeneration skill)
export function getStreakAfterBreak(currentStreak: number, hasRegenerationSkill: boolean): number {
  if (hasRegenerationSkill) {
    return Math.floor(currentStreak * 0.5);
  }
  return 0;
}

// Get days until next milestone
export function daysUntilNextMilestone(
  streakDays: number,
  milestones: StreakMilestone[] = STREAK_MILESTONES,
): number | null {
  const next = getNextMilestone(streakDays, milestones);
  if (!next) return null;
  return next.days - streakDays;
}

export const STREAK_FREEZE_COOLDOWN_DAYS = 7;

export interface StreakAdvanceInput {
  currentStreak: number;
  lastDate?: string | null;
  today: string;
  unlockedSkillIds: string[];
  lastStreakFreezeDate?: string;
  /** No history yet. A quest completion starts at 1. A hero with no date keeps the current count. */
  missingDateStartsAtOne?: boolean;
  /** A broken quest done today starts at 1. The hero's return day can stay at 0. */
  brokenDayCounts?: boolean;
  /** The hero already spent the freeze on this gap, so the quest is covered too. */
  freezeAlreadyUsed?: boolean;
}

export interface StreakAdvance {
  streak: number;
  lastStreakFreezeDate?: string;
  usedFreeze: boolean;
}

/**
 * Move a streak across calendar days. A gap of one day continues. A wider gap
 * keeps the chain only with a freeze or a retention skill.
 */
export function advanceTrackedStreak(input: StreakAdvanceInput): StreakAdvance {
  const freezeDate = input.lastStreakFreezeDate;
  if (!input.lastDate) {
    const streak = input.missingDateStartsAtOne ? Math.max(input.currentStreak, 1) : input.currentStreak;
    return { streak, lastStreakFreezeDate: freezeDate, usedFreeze: false };
  }

  const gap = daysBetween(input.lastDate, input.today);
  if (gap === null || gap <= 0) {
    return { streak: input.currentStreak, lastStreakFreezeDate: freezeDate, usedFreeze: false };
  }
  if (gap === 1) {
    return { streak: input.currentStreak + 1, lastStreakFreezeDate: freezeDate, usedFreeze: false };
  }

  const allowance = getWeeklyStreakFreezeAllowance(input.unlockedSkillIds);
  const freezeReady =
    input.freezeAlreadyUsed ||
    (allowance > 0 && !freezeUsedRecently(freezeDate, input.today));
  if (freezeReady) {
    return {
      streak: input.currentStreak,
      lastStreakFreezeDate: input.freezeAlreadyUsed ? freezeDate : input.today,
      usedFreeze: !input.freezeAlreadyUsed,
    };
  }

  const retention = getStreakRetentionRatio(input.unlockedSkillIds);
  const kept =
    retention > 0
      ? Math.floor(input.currentStreak * retention)
      : getStreakAfterBreak(input.currentStreak, false);
  return {
    streak: input.brokenDayCounts ? Math.max(kept, 1) : kept,
    lastStreakFreezeDate: freezeDate,
    usedFreeze: false,
  };
}

function freezeUsedRecently(lastUsed: string | undefined, today: string): boolean {
  if (!lastUsed) return false;
  const gap = daysBetween(lastUsed, today);
  if (gap === null) return false;
  return gap >= 0 && gap < STREAK_FREEZE_COOLDOWN_DAYS;
}
