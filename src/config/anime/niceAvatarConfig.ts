import { CharacterAppearance, StatName, ClassTier, HairStyle } from '../../types';
import type {
  AvatarConfig,
  HairStyleType,
  ShirtStyleType,
} from '@zamplyy/react-native-nice-avatar';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../appearanceConfig';

// Map our HairStyle to react-native-nice-avatar hairStyle options
const HAIR_STYLE_MAP: Record<HairStyle, HairStyleType> = {
  short: 'normal',
  medium: 'thick',
  long: 'womanLong',
  shaved: 'mohawk',
};

// Map classTier to shirt style (progression feel)
const TIER_SHIRT_MAP: Record<ClassTier, ShirtStyleType> = {
  1: 'short',
  2: 'short',
  3: 'polo',
  4: 'hoody',
  5: 'hoody',
};

// Stat colors for shirt
const STAT_SHIRT_COLORS: Record<StatName, string> = {
  strength: '#C43030',
  vitality: '#1E8C44',
  intelligence: '#2563C4',
  charisma: '#C48B10',
  dexterity: '#6D3AC4',
  willpower: '#C43080',
};

export type Mood = 'happy' | 'neutral' | 'sad';

// Build nice-avatar config from our game state
export function buildNiceAvatarConfig(
  appearance: CharacterAppearance,
  dominantStat: StatName,
  classTier: ClassTier,
  mood: Mood = 'neutral',
): AvatarConfig {
  // Mood overrides eye/mouth, but user choice is the base
  const eyeStyle = mood === 'happy' ? 'smile' : appearance.eyeStyle || 'oval';
  const mouthStyle =
    mood === 'happy' ? 'laugh' : mood === 'sad' ? 'peace' : appearance.mouthStyle || 'smile';
  const glassesStyle = appearance.glassesStyle || 'none';

  return {
    sex: appearance.gender === 'female' ? 'woman' : 'man',
    faceColor: SKIN_TONE_COLORS[appearance.skinTone],
    earSize: 'small' as const,
    hairStyle: HAIR_STYLE_MAP[appearance.hairStyle],
    hairColor: HAIR_COLOR_VALUES[appearance.hairColor],
    eyeStyle,
    noseStyle: 'short' as const,
    mouthStyle,
    glassesStyle,
    hatStyle: 'none' as const,
    shirtStyle: TIER_SHIRT_MAP[classTier],
    shirtColor: STAT_SHIRT_COLORS[dominantStat],
    bgColor: 'transparent',
  };
}
