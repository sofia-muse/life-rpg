import { CrestShape, SigilStyle, HeroAppearance, CharacterAppearance, StatName } from '../types';

// ─── Unlock Conditions ───

export interface AppearanceUnlock {
  type: 'shape' | 'sigil';
  id: CrestShape | SigilStyle;
  label: string;
  condition: string; // display text
  check: (statLevels: Record<StatName, number>, heroLevel: number) => boolean;
}

export const APPEARANCE_UNLOCKS: AppearanceUnlock[] = [
  // Shapes
  { type: 'shape', id: 'shield', label: 'Shield', condition: 'Default', check: () => true },
  { type: 'shape', id: 'circle', label: 'Circle', condition: 'Default', check: () => true },
  {
    type: 'shape',
    id: 'diamond',
    label: 'Diamond',
    condition: 'Any stat level 5',
    check: (stats) => Object.values(stats).some((l) => l >= 5),
  },
  {
    type: 'shape',
    id: 'hexagon',
    label: 'Hexagon',
    condition: 'Hero level 10+',
    check: (_, hl) => hl >= 10,
  },

  // Sigils
  { type: 'sigil', id: 'sword', label: 'Sword', condition: 'Default', check: () => true },
  {
    type: 'sigil',
    id: 'flame',
    label: 'Flame',
    condition: 'Strength level 5',
    check: (stats) => stats.strength >= 5,
  },
  {
    type: 'sigil',
    id: 'tree',
    label: 'Tree',
    condition: 'Vitality level 5',
    check: (stats) => stats.vitality >= 5,
  },
  {
    type: 'sigil',
    id: 'eye',
    label: 'Eye',
    condition: 'Intelligence level 5',
    check: (stats) => stats.intelligence >= 5,
  },
  {
    type: 'sigil',
    id: 'star',
    label: 'Star',
    condition: 'Charisma level 5',
    check: (stats) => stats.charisma >= 5,
  },
  {
    type: 'sigil',
    id: 'crown',
    label: 'Crown',
    condition: 'Hero level 15+',
    check: (_, hl) => hl >= 15,
  },
];

// ─── Stat Pip Thresholds ───
// Level thresholds for stat visual indicators on the crest border
export const STAT_PIP_THRESHOLDS = {
  dot: 3, // faint colored dot
  rune: 7, // small glyph
  glow: 15, // glowing rune
} as const;

// ─── Default Appearance ───

export function getDefaultAppearance(): HeroAppearance {
  return {
    crestShape: 'shield',
    sigil: 'sword',
    accentOverride: 'none',
    titleDisplay: true,
    unlockedCrestShapes: ['shield', 'circle'],
    unlockedSigils: ['sword'],
  };
}

// ─── Default Character Appearance ───

export function getDefaultCharacterAppearance(): CharacterAppearance {
  return {
    gender: 'male',
    skinTone: 2,
    hairStyle: 'short',
    hairColor: 1,
    eyeStyle: 'oval',
    mouthStyle: 'smile',
    glassesStyle: 'none',
  };
}

// ─── Skin tone + hair color palettes ───

export const SKIN_TONE_COLORS: string[] = [
  '#FDDCB5',
  '#F5C8A0',
  '#D4A574',
  '#B07848',
  '#8B5E3C',
  '#5C3A1E',
];

export const HAIR_COLOR_VALUES: string[] = ['#1A1A2E', '#6B4226', '#D4A930', '#C04020', '#C8C8D0'];

// ─── Compute unlocked items from current stats ───

export function computeUnlockedItems(
  statLevels: Record<StatName, number>,
  heroLevel: number,
): { shapes: CrestShape[]; sigils: SigilStyle[] } {
  const shapes: CrestShape[] = [];
  const sigils: SigilStyle[] = [];

  for (const unlock of APPEARANCE_UNLOCKS) {
    if (unlock.check(statLevels, heroLevel)) {
      if (unlock.type === 'shape') shapes.push(unlock.id as CrestShape);
      else sigils.push(unlock.id as SigilStyle);
    }
  }

  return { shapes, sigils };
}

// ─── Accent color resolution ───

export const ACCENT_COLORS: Record<string, string> = {
  strength: '#EF4444',
  vitality: '#22C55E',
  intelligence: '#3B82F6',
  charisma: '#F59E0B',
  dexterity: '#8B5CF6',
  willpower: '#EC4899',
  gold: '#C4A962',
  silver: '#A0AEC0',
};
