import { StatBlock, StatName, STAT_NAMES, ClassTier } from '../types';
import { levelFromXP } from '../config/xpTables';
import { getTierForLevel, getClassName } from '../config/classes';

// Get levels for all stats from XP values
export function getStatLevels(statXP: Record<StatName, number>): Record<StatName, number> {
  const levels: Partial<Record<StatName, number>> = {};
  for (const stat of STAT_NAMES) {
    levels[stat] = levelFromXP(statXP[stat]);
  }
  return levels as Record<StatName, number>;
}

// Calculate hero level as the average of all stat levels
export function calculateHeroLevel(statXP: Record<StatName, number>): number {
  const levels = getStatLevels(statXP);
  const sum = Object.values(levels).reduce((a, b) => a + b, 0);
  return Math.max(1, Math.floor(sum / STAT_NAMES.length));
}

// Determine the dominant stat (highest level, tiebreak by XP)
export function getDominantStat(statXP: Record<StatName, number>): StatName {
  let dominant: StatName = 'strength';
  let maxXP = 0;

  for (const stat of STAT_NAMES) {
    if (statXP[stat] > maxXP) {
      maxXP = statXP[stat];
      dominant = stat;
    }
  }

  return dominant;
}

// Check if hero should tier up
export function checkTierUp(
  currentTier: ClassTier,
  heroLevel: number,
  dominantStat: StatName,
): { shouldTierUp: boolean; newTier: ClassTier; newClass: string } | null {
  const newTier = getTierForLevel(heroLevel);
  if (newTier > currentTier) {
    return {
      shouldTierUp: true,
      newTier,
      newClass: getClassName(dominantStat, newTier),
    };
  }
  return null;
}

// Get stat block from XP (same as getStatLevels — kept as a named alias for call sites)
export function getStatBlock(statXP: Record<StatName, number>): StatBlock {
  return getStatLevels(statXP);
}

// Get the total stat level sum
export function getTotalStatLevels(statXP: Record<StatName, number>): number {
  return Object.values(getStatLevels(statXP)).reduce((a, b) => a + b, 0);
}
