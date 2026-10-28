import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  bgPrimary: '#0B1916',
  bgCanvas: '#07120F',
  bgSecondary: '#142B24',
  bgCard: '#142B24',
  bgCardRaised: '#1A342C',
  bgPanel: '#203B2E',
  bgInset: '#0D211B',
  bgInput: '#10251E',
  bgModal: '#0B1916',

  // Text
  textPrimary: '#F5F0DF',
  textSecondary: '#BECDC3',
  textMuted: '#A0B5A8',
  textSoft: '#D2DDD3',
  textAccent: '#DEC68B',

  // Accents
  gold: '#D5BB7B',
  goldLight: '#E5D39D',
  goldBright: '#F1DEA1',
  goldDark: '#A48942',
  goldGlow: 'rgba(196, 169, 98, 0.18)',
  goldSoft: 'rgba(196, 169, 98, 0.1)',
  starlight: 'rgba(240, 232, 196, 0.65)',
  veil: 'rgba(7, 18, 15, 0.85)',
  moon: '#C9D1E3',
  amethyst: '#7C5CFC',
  amethystGlow: 'rgba(124, 92, 252, 0.25)',
  sapphire: '#4E82FF',
  rose: '#E879B8',

  // Stat colors
  strength: '#F0A18E',
  vitality: '#A6D2A6',
  intelligence: '#8EBAE4',
  charisma: '#E7C987',
  dexterity: '#C0AFE4',
  willpower: '#DDB1CE',

  // Surfaces / glass
  bgGlass: 'rgba(20, 43, 36, 0.85)',
  bgGlassStrong: 'rgba(11, 25, 22, 0.94)',

  // UI
  border: '#2C493C',
  borderLight: '#3A5949',
  borderStrong: '#776F4A',
  borderGlow: 'rgba(196, 169, 98, 0.35)',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  shadowHeavy: 'rgba(5, 8, 20, 0.45)',

  // Tab bar
  tabActive: '#E5D39D',
  tabInactive: '#ADBEAF',
  tabBg: '#0A1914',
};

export const fonts = {
  heading: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia',
    default: 'Georgia',
  }) as string,
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: 'system-ui',
    default: 'System',
  }) as string,
  journal: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia',
    default: 'serif',
  }) as string,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 36,
};

export const typography = {
  heading: {
    fontFamily: fonts.heading,
    letterSpacing: 0.6,
  },
  headingWide: {
    fontFamily: fonts.heading,
    letterSpacing: 1.2,
  },
  overline: {
    fontFamily: fonts.heading,
    letterSpacing: 1.4,
  },
  body: {
    fontFamily: fonts.body,
    letterSpacing: 0.15,
  },
  bodyStrong: {
    fontFamily: fonts.body,
    letterSpacing: 0.2,
    fontWeight: '600' as const,
  },
  journal: {
    fontFamily: fonts.journal,
    letterSpacing: 0.25,
  },
};
