import { AvatarConfig, ClassTier, StatName } from '../types';

const STAT_PALETTES: Record<StatName, string[]> = {
  strength: ['#EF4444', '#DC2626', '#B91C1C', '#7F1D1D'],
  vitality: ['#22C55E', '#16A34A', '#15803D', '#166534'],
  intelligence: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E3A8A'],
  charisma: ['#F59E0B', '#D97706', '#B45309', '#78350F'],
  dexterity: ['#8B5CF6', '#7C3AED', '#6D28D9', '#4C1D95'],
  willpower: ['#EC4899', '#DB2777', '#BE185D', '#831843'],
};

const STAT_AURAS: Record<StatName, string> = {
  strength: 'flame',
  vitality: 'nature',
  intelligence: 'arcane',
  charisma: 'radiance',
  dexterity: 'shadow',
  willpower: 'spirit',
};

const TIER_BADGES: Record<ClassTier, string> = {
  1: '🔰',
  2: '⚔️',
  3: '🛡️',
  4: '👑',
  5: '💎',
};

export function getAvatarConfig(dominantStat: StatName, tier: ClassTier): AvatarConfig {
  return {
    tier,
    dominantStat,
    palette: STAT_PALETTES[dominantStat],
    aura: STAT_AURAS[dominantStat],
    badge: TIER_BADGES[tier],
  };
}

export function getAvatarGradient(dominantStat: StatName): [string, string] {
  const palette = STAT_PALETTES[dominantStat];
  return [palette[0], palette[2]];
}

export { STAT_PALETTES, STAT_AURAS, TIER_BADGES };
