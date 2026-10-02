import { QuestDifficulty, DIFFICULTY_XP } from '../types';
import { levelFromXP, xpProgressInLevel } from '../config/xpTables';

export interface XPReward {
  baseXP: number;
  /** Hero-streak bonus plus quest-streak bonus. Both are computed from base XP. */
  streakBonus: number;
  heroStreakBonus: number;
  questStreakBonus: number;
  skillBonus: number;
  totalXP: number;
}

/**
 * Quest XP. Hero streak and quest streak each add a bonus from the base, and skill
 * percent does too. They do not multiply each other.
 */
export function calculateXPReward(
  difficulty: QuestDifficulty,
  heroStreakMultiplier: number,
  skillBonusPercent: number = 0,
  questStreakMultiplier: number = 1,
): XPReward {
  const baseXP = DIFFICULTY_XP[difficulty];
  const heroStreakBonus = bonusFromMultiplier(baseXP, heroStreakMultiplier);
  const questStreakBonus = bonusFromMultiplier(baseXP, questStreakMultiplier);
  const streakBonus = heroStreakBonus + questStreakBonus;
  const skillBonus = Math.floor(baseXP * (skillBonusPercent / 100));
  const totalXP = baseXP + streakBonus + skillBonus;

  return { baseXP, streakBonus, heroStreakBonus, questStreakBonus, skillBonus, totalXP };
}

/**
 * Extra XP from a multiplier, taken from the base. `floor(base * multiplier) - base`
 * avoids the binary error in `multiplier - 1` (1.2 - 1 is 0.1999…).
 */
function bonusFromMultiplier(baseXP: number, multiplier: number): number {
  if (multiplier <= 1) return 0;
  return Math.floor(baseXP * multiplier + 1e-9) - baseXP;
}

/** Full XP payouts for side quests and boss steps in one hero-day. Dailies are outside this budget. */
export const DAILY_SIDE_BOSS_PAYOUTS = 2;

export function takeSideBossPayout(
  payoutDate: string | undefined,
  payoutsUsed: number,
  today: string,
): { granted: boolean; payoutDate: string; payoutsUsed: number } {
  const used = payoutDate === today ? payoutsUsed : 0;
  if (used >= DAILY_SIDE_BOSS_PAYOUTS) {
    return { granted: false, payoutDate: today, payoutsUsed: used };
  }
  return { granted: true, payoutDate: today, payoutsUsed: used + 1 };
}

/** Slice of a full quest reward for one boss step. The last step keeps the remainder. */
export function bossStepXpShare(totalXp: number, totalSteps: number, completedStep: number): number {
  const steps = Math.max(1, totalSteps);
  if (steps === 1) return totalXp;
  const share = Math.floor(totalXp / steps);
  const step = Math.min(Math.max(completedStep, 1), steps);
  if (step === steps) {
    return totalXp - share * (steps - 1);
  }
  return share;
}

// Apply XP to a stat and check for level up
export function applyXP(
  currentXP: number,
  xpToAdd: number,
): { newXP: number; oldLevel: number; newLevel: number; didLevelUp: boolean } {
  const oldLevel = levelFromXP(currentXP);
  const newXP = currentXP + xpToAdd;
  const newLevel = levelFromXP(newXP);

  return {
    newXP,
    oldLevel,
    newLevel,
    didLevelUp: newLevel > oldLevel,
  };
}

// Get stat progress for display
export function getStatDisplayProgress(totalXP: number): {
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
} {
  const level = levelFromXP(totalXP);
  const { currentLevelXP, xpNeeded, progress } = xpProgressInLevel(totalXP);
  return {
    level,
    currentXP: currentLevelXP,
    xpNeeded,
    progress,
  };
}

/** Rest-day vitality XP. The skill sets the base; each vitality level adds 1. */
export function getRestDayXP(hasSecondWindSkill: boolean, vitalityLevel = 0): number {
  const base = hasSecondWindSkill ? 15 : 10;
  return base + Math.max(0, Math.floor(vitalityLevel));
}
