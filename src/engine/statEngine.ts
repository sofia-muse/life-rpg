import { StatBlock, StatName, STAT_NAMES, ClassTier } from '../types';
import { computeHeroLevel, levelFromXP } from '../config/xpTables';
import { getTierForLevel, getClassName } from '../config/classes';

/** A challenger becomes the class stat only after leading by a full level or 10% XP. */
export const DOMINANT_STAT_XP_LEAD = 1.1;

// Get levels for all stats from XP values
export function getStatLevels(statXP: Record<StatName, number>): Record<StatName, number> {
  const levels: Partial<Record<StatName, number>> = {};
  for (const stat of STAT_NAMES) {
    levels[stat] = levelFromXP(statXP[stat]);
  }
  return levels as Record<StatName, number>;
}

// Hero level blends the highest stat with the mean of the rest.
export function calculateHeroLevel(statXP: Record<StatName, number>): number {
  return computeHeroLevel(getStatLevels(statXP));
}

/**
 * Class identity sticks until a challenger leads the anchored stat by a whole level
 * or by at least 10% XP. Ties and small leads keep the current stat.
 */
export function resolveClassStat(
  statXP: Record<StatName, number>,
  currentStat: StatName,
): StatName {
  const levels = getStatLevels(statXP);
  const currentLevel = levels[currentStat];
  const currentXp = statXP[currentStat];
  const xpLead = Math.floor(currentXp * DOMINANT_STAT_XP_LEAD);
  let resolved = currentStat;

  for (const stat of STAT_NAMES) {
    if (stat === currentStat) continue;
    const leadsByLevel = levels[stat] >= currentLevel + 1;
    const leadsByXp = statXP[stat] > currentXp && statXP[stat] >= xpLead;
    if ((leadsByLevel || leadsByXp) && statXP[stat] > statXP[resolved]) {
      resolved = stat;
    }
  }

  return resolved;
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

// Get stat block from XP
export function getStatBlock(statXP: Record<StatName, number>): StatBlock {
  return {
    strength: levelFromXP(statXP.strength),
    vitality: levelFromXP(statXP.vitality),
    intelligence: levelFromXP(statXP.intelligence),
    charisma: levelFromXP(statXP.charisma),
    dexterity: levelFromXP(statXP.dexterity),
    willpower: levelFromXP(statXP.willpower),
  };
}

// Get the total stat level sum
export function getTotalStatLevels(statXP: Record<StatName, number>): number {
  return Object.values(getStatLevels(statXP)).reduce((a, b) => a + b, 0);
}
