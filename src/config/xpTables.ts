import { XPThreshold } from '../types';

// XP required per level follows: baseXP * level^1.5
// Level 1: 100 XP, Level 2: 283, Level 3: 520, etc.
const BASE_XP = 100;

export function xpForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, 1.5));
}

export const MAX_LEVEL = 100;

// Precomputed thresholds for levels 1-100.
// XP_TABLE[i].totalXP = sum of xpForLevel(1)..xpForLevel(i+1) — XP needed to *finish* level i+1.
export const XP_TABLE: XPThreshold[] = (() => {
  const table: XPThreshold[] = [];
  let cumulative = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const needed = xpForLevel(level);
    cumulative += needed;
    table.push({ level, totalXP: cumulative, xpForLevel: needed });
  }
  return table;
})();

/** Cumulative XP required to reach the end of `level` (level 0 → 0). */
export function totalXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level >= MAX_LEVEL) return XP_TABLE[MAX_LEVEL - 1].totalXP;
  return XP_TABLE[level - 1].totalXP;
}

// Hero level = average of all stat levels
export function computeHeroLevel(statLevels: Record<string, number>): number {
  const levels = Object.values(statLevels);
  return Math.floor(levels.reduce((a, b) => a + b, 0) / levels.length);
}

/**
 * Current level given accumulated total XP.
 * Binary-searches XP_TABLE: level is the count of finished level thresholds ≤ totalXP.
 */
export function levelFromXP(totalXP: number): number {
  if (totalXP < XP_TABLE[0].totalXP) return 0;
  if (totalXP >= XP_TABLE[MAX_LEVEL - 1].totalXP) return MAX_LEVEL;

  let lo = 0;
  let hi = MAX_LEVEL - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (XP_TABLE[mid].totalXP <= totalXP) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

// Get XP progress within current level
export function xpProgressInLevel(totalXP: number): {
  currentLevelXP: number;
  xpNeeded: number;
  progress: number;
} {
  const level = levelFromXP(totalXP);
  const xpAtLevelStart = totalXPForLevel(level);
  const xpNeeded =
    level >= MAX_LEVEL ? XP_TABLE[MAX_LEVEL - 1].xpForLevel : xpForLevel(level + 1);
  const currentLevelXP = totalXP - xpAtLevelStart;
  return {
    currentLevelXP,
    xpNeeded,
    progress: xpNeeded > 0 ? Math.min(currentLevelXP / xpNeeded, 1) : 1,
  };
}
