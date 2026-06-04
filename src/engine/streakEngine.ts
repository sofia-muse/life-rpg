import { StreakMilestone } from '../types';

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

// Get current streak multiplier
export function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1.0;
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays >= milestone.days) {
      multiplier = milestone.multiplier;
    }
  }
  return multiplier;
}

// Get the next milestone
export function getNextMilestone(streakDays: number): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays < milestone.days) {
      return milestone;
    }
  }
  return null;
}

// Get current milestone
export function getCurrentMilestone(streakDays: number): StreakMilestone | null {
  let current: StreakMilestone | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays >= milestone.days) {
      current = milestone;
    }
  }
  return current;
}

// Check if streak should reset (missed a day)
export function shouldResetStreak(lastActiveDate: string, today: string): boolean {
  const last = new Date(lastActiveDate);
  const now = new Date(today);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 1;
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
export function daysUntilNextMilestone(streakDays: number): number | null {
  const next = getNextMilestone(streakDays);
  if (!next) return null;
  return next.days - streakDays;
}
