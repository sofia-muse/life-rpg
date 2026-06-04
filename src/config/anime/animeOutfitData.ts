import { ClassTier, Gender } from '../../types';

export interface OutfitPaths {
  base: string;
  detail: string;
  collar?: string;
  shoulderPad?: string;
  cape?: string;
}

// Outfits build on each other — higher tiers add more layers
const OUTFITS_MALE: Record<ClassTier, OutfitPaths> = {
  1: {
    base: 'M46 72 Q30 74 18 88 L18 130 L82 130 L82 88 Q70 74 54 72 Z',
    detail: 'M42 72 L42 80 L58 80 L58 72',
  },
  2: {
    base: 'M46 72 Q30 74 18 88 L18 130 L82 130 L82 88 Q70 74 54 72 Z',
    detail: 'M42 72 L42 80 L58 80 L58 72',
    collar: 'M40 72 Q50 68 60 72 Q50 76 40 72 Z',
  },
  3: {
    base: 'M46 72 Q30 74 18 88 L18 130 L82 130 L82 88 Q70 74 54 72 Z',
    detail: 'M42 72 L42 80 L58 80 L58 72 M30 95 L70 95',
    collar: 'M38 72 Q50 66 62 72 Q50 78 38 72 Z',
    shoulderPad:
      'M18 86 Q14 82 16 78 Q24 76 30 80 L26 88 Z M82 86 Q86 82 84 78 Q76 76 70 80 L74 88 Z',
  },
  4: {
    base: 'M46 72 Q30 74 18 88 L18 130 L82 130 L82 88 Q70 74 54 72 Z',
    detail: 'M42 72 L42 80 L58 80 L58 72 M30 95 L70 95 M50 80 L50 95',
    collar: 'M36 72 Q50 64 64 72 Q50 80 36 72 Z',
    shoulderPad:
      'M18 86 Q12 80 14 74 Q24 72 32 78 L26 88 Z M82 86 Q88 80 86 74 Q76 72 68 78 L74 88 Z',
    cape: 'M18 88 Q10 90 8 130 L16 130 Z M82 88 Q90 90 92 130 L84 130 Z',
  },
  5: {
    base: 'M46 72 Q30 74 18 88 L18 130 L82 130 L82 88 Q70 74 54 72 Z',
    detail: 'M42 72 L42 82 L58 82 L58 72 M28 95 L72 95 M50 82 L50 95 M38 82 L38 95 M62 82 L62 95',
    collar: 'M34 72 Q50 62 66 72 Q50 82 34 72 Z',
    shoulderPad:
      'M16 86 Q8 78 12 70 Q24 68 34 76 L26 88 Z M84 86 Q92 78 88 70 Q76 68 66 76 L74 88 Z',
    cape: 'M16 86 Q4 90 2 130 L14 130 Z M84 86 Q96 90 98 130 L86 130 Z',
  },
};

const OUTFITS_FEMALE: Record<ClassTier, OutfitPaths> = {
  1: {
    base: 'M47 70 Q34 72 24 86 L22 130 L78 130 L76 86 Q66 72 53 70 Z',
    detail: 'M43 70 L43 78 L57 78 L57 70',
  },
  2: {
    base: 'M47 70 Q34 72 24 86 L22 130 L78 130 L76 86 Q66 72 53 70 Z',
    detail: 'M43 70 L43 78 L57 78 L57 70',
    collar: 'M42 70 Q50 66 58 70 Q50 74 42 70 Z',
  },
  3: {
    base: 'M47 70 Q34 72 24 86 L22 130 L78 130 L76 86 Q66 72 53 70 Z',
    detail: 'M43 70 L43 78 L57 78 L57 70 M32 94 L68 94',
    collar: 'M40 70 Q50 64 60 70 Q50 76 40 70 Z',
    shoulderPad:
      'M24 84 Q20 80 22 76 Q30 74 36 78 L30 86 Z M76 84 Q80 80 78 76 Q70 74 64 78 L70 86 Z',
  },
  4: {
    base: 'M47 70 Q34 72 24 86 L22 130 L78 130 L76 86 Q66 72 53 70 Z',
    detail: 'M43 70 L43 78 L57 78 L57 70 M32 94 L68 94 M50 78 L50 94',
    collar: 'M38 70 Q50 62 62 70 Q50 78 38 70 Z',
    shoulderPad:
      'M24 84 Q18 78 20 72 Q30 70 38 76 L30 86 Z M76 84 Q82 78 80 72 Q70 70 62 76 L70 86 Z',
    cape: 'M22 86 Q14 90 12 130 L20 130 Z M78 86 Q86 90 88 130 L80 130 Z',
  },
  5: {
    base: 'M47 70 Q34 72 24 86 L22 130 L78 130 L76 86 Q66 72 53 70 Z',
    detail: 'M43 70 L43 80 L57 80 L57 70 M30 94 L70 94 M50 80 L50 94 M40 80 L40 94 M60 80 L60 94',
    collar: 'M36 70 Q50 60 64 70 Q50 80 36 70 Z',
    shoulderPad:
      'M22 84 Q14 76 18 68 Q28 66 38 74 L28 86 Z M78 84 Q86 76 82 68 Q72 66 62 74 L72 86 Z',
    cape: 'M20 84 Q8 88 6 130 L18 130 Z M80 84 Q92 88 94 130 L82 130 Z',
  },
};

export const OUTFIT_PATHS: Record<Gender, Record<ClassTier, OutfitPaths>> = {
  male: OUTFITS_MALE,
  female: OUTFITS_FEMALE,
};
