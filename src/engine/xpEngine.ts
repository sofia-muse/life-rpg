import { QuestDifficulty, DIFFICULTY_XP } from '../types';
import { levelFromXP, xpProgressInLevel } from '../config/xpTables';

export interface XPReward {
  baseXP: number;
  streakBonus: number;
  skillBonus: number;
  totalXP: number;
}

// Calculate XP reward for completing a quest
export function calculateXPReward(
  difficulty: QuestDifficulty,
  streakMultiplier: number,
  skillBonusPercent: number = 0,
): XPReward {
  const baseXP = DIFFICULTY_XP[difficulty];
  const streakBonus = Math.floor(baseXP * (streakMultiplier - 1));
  const skillBonus = Math.floor(baseXP * (skillBonusPercent / 100));
  const totalXP = baseXP + streakBonus + skillBonus;

  return { baseXP, streakBonus, skillBonus, totalXP };
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

// Rest day XP reward
export function getRestDayXP(hasSecondWindSkill: boolean): number {
  return hasSecondWindSkill ? 15 : 10;
}
