import { CrestShape, SigilStyle, StatName } from '../../types';

// All paths designed for a 100x100 viewBox

// ─── Crest Shapes ───
// Each returns an SVG path string for the outline

export const CREST_SHAPES: Record<CrestShape, string> = {
  shield: 'M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z',
  circle: 'M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z',
  diamond: 'M50 5 L90 50 L50 95 L10 50 Z',
  hexagon: 'M50 5 L88 27.5 L88 72.5 L50 95 L12 72.5 L12 27.5 Z',
};

// ─── Sigils ───
// Simplified line-art icons centered in viewBox

export const SIGILS: Record<SigilStyle, string> = {
  sword: 'M50 20 L50 70 M40 30 L60 30 M35 70 L65 70 M42 70 L42 80 M58 70 L58 80',
  flame:
    'M50 25 Q60 35 55 45 Q65 35 60 50 Q70 40 62 55 Q65 65 50 75 Q35 65 38 55 Q30 40 40 50 Q35 35 45 45 Q40 35 50 25 Z',
  eye: 'M20 50 Q35 30 50 30 Q65 30 80 50 Q65 70 50 70 Q35 70 20 50 Z M50 38 A12 12 0 1 1 50 62 A12 12 0 1 1 50 38 Z M50 44 A6 6 0 1 1 50 56 A6 6 0 1 1 50 44 Z',
  star: 'M50 20 L56 40 L77 40 L60 52 L67 73 L50 60 L33 73 L40 52 L23 40 L44 40 Z',
  tree: 'M50 20 L65 45 L57 45 L70 65 L55 65 L55 80 L45 80 L45 65 L30 65 L43 45 L35 45 Z',
  crown: 'M20 65 L20 40 L35 55 L50 30 L65 55 L80 40 L80 65 Z M20 65 L80 65 L80 75 L20 75 Z',
};

// ─── Stat Rune Glyphs ───
// Small symbols for each stat, designed for ~16x16 space

export const STAT_RUNES: Record<StatName, string> = {
  strength: 'M3 13 L8 3 L13 13 M5 9 L11 9', // upward arrow
  vitality: 'M8 3 L8 8 Q3 8 3 13 Q8 10 13 13 Q13 8 8 8', // heart-ish
  intelligence: 'M4 13 A4 4 0 1 1 12 13 M8 5 L8 3', // lightbulb
  charisma: 'M8 3 L9 7 L13 7 L10 10 L11 14 L8 11 L5 14 L6 10 L3 7 L7 7 Z', // small star
  dexterity: 'M3 8 L7 3 L7 7 L13 7 L13 13 L7 13 L7 9 L3 8', // arrow right
  willpower:
    'M8 3 A5 5 0 0 1 13 8 A5 5 0 0 1 8 13 A5 5 0 0 1 3 8 A5 5 0 0 1 8 3 Z M8 6 A2 2 0 1 1 8 10 A2 2 0 1 1 8 6 Z', // target
};

// ─── Stat pip positions ───
// 6 positions around the crest border (top, top-right, bottom-right, bottom, bottom-left, top-left)
// Returns center (x, y) for each stat indicator at a given size

export function getStatPipPositions(size: number): Record<StatName, { x: number; y: number }> {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46; // just outside the shape

  // Positions at 60-degree intervals starting from top
  const stats: StatName[] = [
    'strength',
    'vitality',
    'intelligence',
    'charisma',
    'dexterity',
    'willpower',
  ];
  const positions: Record<string, { x: number; y: number }> = {};

  stats.forEach((stat, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    positions[stat] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return positions as Record<StatName, { x: number; y: number }>;
}

// ─── Tier frame configs ───

export interface TierFrameConfig {
  strokeWidth: number;
  dashArray?: string;
  cornerDecoration: boolean;
  outerRing: boolean;
  particleCount: number;
  glowIntensity: number; // 0-1
}

export const TIER_FRAMES: Record<number, TierFrameConfig> = {
  1: {
    strokeWidth: 2,
    cornerDecoration: false,
    outerRing: false,
    particleCount: 0,
    glowIntensity: 0.1,
  },
  2: {
    strokeWidth: 2.5,
    dashArray: '4,2',
    cornerDecoration: false,
    outerRing: false,
    particleCount: 0,
    glowIntensity: 0.2,
  },
  3: {
    strokeWidth: 3,
    cornerDecoration: true,
    outerRing: true,
    particleCount: 0,
    glowIntensity: 0.3,
  },
  4: {
    strokeWidth: 3.5,
    cornerDecoration: true,
    outerRing: true,
    particleCount: 4,
    glowIntensity: 0.5,
  },
  5: {
    strokeWidth: 4,
    cornerDecoration: true,
    outerRing: true,
    particleCount: 8,
    glowIntensity: 0.7,
  },
};
