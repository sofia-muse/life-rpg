import { XPThreshold } from '../types';

/**
 * XP to finish a stat level: floor(14 * level^0.8).
 * Tuned for 2–3 quests a day: a focused hero reaches hero level 5 in about two weeks,
 * a balanced hero reaches level 15 in two to three months, and level 50 in about a year.
 */
const BASE_XP = 14;
const XP_EXPONENT = 0.8;

export const HERO_LEVEL_DOMINANT_WEIGHT = 0.6;
export const HERO_LEVEL_OTHER_WEIGHT = 0.4;

export function xpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, XP_EXPONENT));
}

export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// Precomputed thresholds for levels 1-100
export const XP_TABLE: XPThreshold[] = Array.from({ length: 100 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    totalXP: totalXPForLevel(level),
    xpForLevel: xpForLevel(level),
  };
});

export const MAX_LEVEL = 100;

/**
 * Hero level weights the highest stat at 60% and the mean of the others at 40%.
 * A specialist still climbs; spreading XP across every stat still reaches a tier sooner.
 */
export function computeHeroLevel(statLevels: Record<string, number>): number {
  const levels = Object.values(statLevels);
  if (levels.length === 0) return 1;
  const dominant = Math.max(...levels);
  const othersMean =
    levels.length > 1 ? (levels.reduce((sum, level) => sum + level, 0) - dominant) / (levels.length - 1) : 0;
  return Math.max(
    1,
    Math.floor(HERO_LEVEL_DOMINANT_WEIGHT * dominant + HERO_LEVEL_OTHER_WEIGHT * othersMean),
  );
}

// Get level from total XP
export function levelFromXP(totalXP: number): number {
  let accumulated = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    accumulated += xpForLevel(level);
    if (totalXP < accumulated) return level - 1;
  }
  return MAX_LEVEL;
}

// Get XP progress within current level
export function xpProgressInLevel(totalXP: number): {
  currentLevelXP: number;
  xpNeeded: number;
  progress: number;
} {
  const level = levelFromXP(totalXP);
  const xpAtLevelStart = totalXPForLevel(level);
  const xpNeeded = xpForLevel(level + 1);
  const currentLevelXP = totalXP - xpAtLevelStart;
  return {
    currentLevelXP,
    xpNeeded,
    progress: xpNeeded > 0 ? Math.min(currentLevelXP / xpNeeded, 1) : 1,
  };
}
