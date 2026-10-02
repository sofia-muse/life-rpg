import { StreakMilestone } from '../types';
import { daysBetween } from './calendar';

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
