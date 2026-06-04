import { Gender, HairStyle } from '../../types';

// All paths for 100x130 viewBox — anime-style with large eyes, soft curves

// ─── Body/Shoulders ───
export const BODY_PATHS: Record<Gender, { shoulders: string; shadow: string; neck: string }> = {
  male: {
    neck: 'M44 60 C44 62 44 68 45 70 Q46 72 48 72 L52 72 Q54 72 55 70 C56 68 56 62 56 60',
    shoulders:
      'M48 72 C40 73 30 76 22 84 C18 89 16 100 16 130 L84 130 C84 100 82 89 78 84 C70 76 60 73 52 72',
    shadow: 'M48 72 C42 74 34 78 28 86 C24 92 22 105 22 130 L50 130 L50 72 Z',
  },
  female: {
    neck: 'M45 59 C45 61 45 66 46 68 Q47 70 49 70 L51 70 Q53 70 54 68 C55 66 55 61 55 59',
    shoulders:
      'M49 70 C42 71 34 74 26 82 C22 87 20 98 20 130 L80 130 C80 98 78 87 74 82 C66 74 58 71 51 70',
    shadow: 'M49 70 C44 72 38 76 32 84 C28 90 26 102 26 130 L50 130 L50 70 Z',
  },
};

// ─── Face ───
export const FACE_PATHS: Record<
  Gender,
  {
    outline: { cx: number; cy: number; rx: number; ry: number };
    jawShadow: string;
    chinPath: string;
  }
> = {
  male: {
    outline: { cx: 50, cy: 36, rx: 23, ry: 27 },
    jawShadow:
      'M29 40 C34 56 42 62 50 63 C58 62 66 56 71 40 L71 46 C66 60 58 66 50 67 C42 66 34 60 29 46 Z',
    chinPath: 'M38 56 Q44 64 50 65 Q56 64 62 56',
  },
  female: {
    outline: { cx: 50, cy: 35, rx: 22, ry: 26 },
    jawShadow:
      'M30 38 C35 54 43 60 50 61 C57 60 65 54 70 38 L70 44 C65 58 57 64 50 65 C43 64 35 58 30 44 Z',
    chinPath: 'M39 54 Q45 62 50 63 Q55 62 61 54',
  },
};

// ─── Eyes (larger anime-style) ───
export const EYE_CONFIG = {
  leftCenter: { x: 38, y: 34 },
  rightCenter: { x: 62, y: 34 },
  // Larger, more expressive anime eyes
  outerRx: 8.5,
  outerRy: 7,
  irisR: 5.5,
  pupilR: 3,
  highlightR: 2,
  highlightOffset: { x: 2, y: -2 },
  smallHighlight: { r: 1, dx: -1.5, dy: 1.5 },
  // Upper eyelid curve (gives anime eye shape)
  upperLid: (cx: number, cy: number) =>
    `M${cx - 8.5} ${cy - 1} Q${cx - 4} ${cy - 8} ${cx} ${cy - 7.5} Q${cx + 4} ${cy - 8} ${cx + 8.5} ${cy - 1}`,
  // Lower lash line
  lowerLash: (cx: number, cy: number) =>
    `M${cx - 7} ${cy + 4} Q${cx} ${cy + 7.5} ${cx + 7} ${cy + 4}`,
  // Eyelashes (top)
  lashes: (cx: number, cy: number) =>
    `M${cx - 8} ${cy - 2} Q${cx - 9} ${cy - 5} ${cx - 10} ${cy - 6} M${cx + 8} ${cy - 2} Q${cx + 9} ${cy - 5} ${cx + 10} ${cy - 6}`,
  // Closed eye line
  closedLine: 'M-8 0 Q-3 2 0 2.5 Q3 2 8 0',
  // Happy eye (^_^ style)
  happyLine: 'M-7 2 Q-3 -3 0 -4 Q3 -3 7 2',
};

// ─── Mouth ───
export const MOUTH_PATHS: Record<string, string> = {
  smile: 'M43 50 Q47 54 50 54.5 Q53 54 57 50',
  neutral: 'M44 51 Q47 51.5 50 51.5 Q53 51.5 56 51',
  frown: 'M43 53 Q47 50.5 50 50 Q53 50.5 57 53',
  open: 'M43 50 Q47 54 50 54.5 Q53 54 57 50 Q53 56.5 50 57 Q47 56.5 43 50 Z',
};

// ─── Hair Back (behind face) — more flowing, layered ───
export const HAIR_BACK_PATHS: Record<HairStyle, string> = {
  short:
    'M26 18 C26 22 25 30 26 38 C27 46 30 52 34 56 L34 48 C30 42 28 34 28 24 ' +
    'C30 14 38 8 50 7 C62 8 70 14 72 24 C72 34 70 42 66 48 L66 56 C70 52 73 46 74 38 ' +
    'C75 30 74 22 74 18 C72 6 62 0 50 -1 C38 0 28 6 26 18 Z',
  medium:
    'M24 16 C24 28 23 45 26 60 C28 70 32 78 36 82 L34 72 C30 62 27 48 26 32 ' +
    'C26 20 32 10 50 8 C68 10 74 20 74 32 C73 48 70 62 66 72 L64 82 C68 78 72 70 74 60 ' +
    'C77 45 76 28 76 16 C74 4 64 -2 50 -3 C36 -2 26 4 24 16 Z',
  long:
    'M22 14 C22 30 21 55 24 78 C26 92 30 102 34 108 L32 96 C28 84 25 66 24 44 ' +
    'C24 28 28 14 38 8 C44 4 50 3 50 3 C50 3 56 4 62 8 C72 14 76 28 76 44 ' +
    'C75 66 72 84 68 96 L66 108 C70 102 74 92 76 78 C79 55 78 30 78 14 ' +
    'C76 2 66 -4 50 -5 C34 -4 24 2 22 14 Z',
  shaved:
    'M30 20 C30 24 30 30 32 36 L32 32 C31 28 31 24 32 20 ' +
    'C34 12 42 7 50 6 C58 7 66 12 68 20 C69 24 69 28 68 32 L68 36 C70 30 70 24 70 20 ' +
    'C68 10 60 4 50 3 C40 4 32 10 30 20 Z',
};

// ─── Hair Front (bangs/fringe) — more detailed strands ───
export const HAIR_FRONT_PATHS: Record<HairStyle, string> = {
  short:
    'M28 22 C32 12 40 7 50 6 C60 7 68 12 72 22 ' +
    'L72 28 C66 18 58 14 50 13 C42 14 34 18 28 28 Z ' +
    'M36 20 C38 16 42 13 46 12 L44 24 Z ' +
    'M54 12 C58 13 62 16 64 20 L56 24 Z',
  medium:
    'M26 24 C30 10 40 4 50 3 C60 4 70 10 74 24 ' +
    'L74 34 C68 20 58 14 50 13 C42 14 32 20 26 34 Z ' +
    'M32 26 C35 16 40 10 46 8 L42 30 Z ' +
    'M54 8 C60 10 65 16 68 26 L58 30 Z ' +
    'M46 10 L50 4 L54 10 Q52 16 50 18 Q48 16 46 10 Z',
  long:
    'M24 22 C28 6 38 -1 50 -2 C62 -1 72 6 76 22 ' +
    'L76 36 C70 18 60 10 50 9 C40 10 30 18 24 36 Z ' +
    'M30 28 C34 14 40 6 48 4 L42 34 Z ' +
    'M52 4 C60 6 66 14 70 28 L58 34 Z ' +
    'M44 8 L48 0 L52 8 Q50 14 48 18 Q46 14 44 8 Z ' +
    'M38 14 L42 6 L40 22 Z M58 6 L62 14 L60 22 Z',
  shaved:
    'M32 21 C36 13 42 8 50 7 C58 8 64 13 68 21 ' + 'L68 25 C64 17 58 13 50 12 C42 13 36 17 32 25 Z',
};

// ─── Ear hints ───
export const EAR_PATHS: Record<Gender, string> = {
  male: 'M27 32 C24 32 23 36 23 40 C23 44 24 48 27 48',
  female: 'M28 32 C25 32 24 35 24 39 C24 43 25 46 28 46',
};
