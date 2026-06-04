import { StatName, ClassTier } from '../types';
import { getClassName, getTierForLevel, getClassDefinition } from '../config/classes';
import { getDominantStat, calculateHeroLevel } from './statEngine';

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
): ClassEvolution | null {
  const heroLevel = calculateHeroLevel(statXP);
  const dominantStat = getDominantStat(statXP);
  const newTier = getTierForLevel(heroLevel);

  // Tier up check
  if (newTier > currentTier) {
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

  // Dominant stat change check (same tier, different class)
  const newClassName = getClassName(dominantStat, currentTier);
  if (newClassName !== currentClassName) {
    const classDef = getClassDefinition(dominantStat, currentTier);
    return {
      oldClass: currentClassName,
      newClass: classDef.title,
      oldTier: currentTier,
      newTier: currentTier,
      dominantStat,
      description: `Your focus has shifted — you are now a ${classDef.title}!`,
    };
  }

  return null;
}

// Get evolution narrative text
export function getEvolutionNarrative(evolution: ClassEvolution): string {
  if (evolution.newTier > evolution.oldTier) {
    return `Through dedication and perseverance, the ${evolution.oldClass} has evolved into a ${evolution.newClass}! ${evolution.description}`;
  }
  return `The winds of change blow — the hero's path shifts from ${evolution.oldClass} to ${evolution.newClass}. ${evolution.description}`;
}
