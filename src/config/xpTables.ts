import { XPThreshold } from '../types';

// XP required per level follows: baseXP * level^1.5
// Level 1: 100 XP, Level 2: 283, Level 3: 520, etc.
const BASE_XP = 100;

export function xpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, 1.5));
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

// Hero level = average of all stat levels
export function computeHeroLevel(statLevels: Record<string, number>): number {
  const levels = Object.values(statLevels);
  return Math.floor(levels.reduce((a, b) => a + b, 0) / levels.length);
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
