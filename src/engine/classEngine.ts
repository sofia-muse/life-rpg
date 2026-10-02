import { StatName, ClassTier } from '../types';
import { getClassName, getTierForLevel, getClassDefinition } from '../config/classes';
import { resolveClassStat, calculateHeroLevel } from './statEngine';

export interface ClassEvolution {
  oldClass: string;
  newClass: string;
  oldTier: ClassTier;
  newTier: ClassTier;
  dominantStat: StatName;
  description: string;
}

// Check if hero should evolve their class
export function checkClassEvolution(
  statXP: Record<StatName, number>,
  currentTier: ClassTier,
  currentClassName: string,
  currentDominantStat: StatName,
): ClassEvolution | null {
  const heroLevel = calculateHeroLevel(statXP);
  const newTier = getTierForLevel(heroLevel);

  // Class only changes automatically when the tier rises. Same-tier shifts are a player respec.
  if (newTier > currentTier) {
    const dominantStat = resolveClassStat(statXP, currentDominantStat);
    const classDef = getClassDefinition(dominantStat, newTier);
    return {
      oldClass: currentClassName,
      newClass: classDef.title,
      oldTier: currentTier,
      newTier,
      dominantStat,
      description: classDef.description,
    };
  }

  return null;
}

/** Player-chosen class at the current tier. */
export function respecClassIdentity(
  stat: StatName,
  tier: ClassTier,
): { dominantStat: StatName; className: string } {
  return { dominantStat: stat, className: getClassName(stat, tier) };
}

// Get evolution narrative text
export function getEvolutionNarrative(evolution: ClassEvolution): string {
  if (evolution.newTier > evolution.oldTier) {
    return `Through dedication and perseverance, the ${evolution.oldClass} has evolved into a ${evolution.newClass}! ${evolution.description}`;
  }
  return `The winds of change blow — the hero's path shifts from ${evolution.oldClass} to ${evolution.newClass}. ${evolution.description}`;
}
