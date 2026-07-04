import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  bgPrimary: '#0F0F1A',
  bgCanvas: '#090B14',
  bgSecondary: '#1A1A2E',
  bgCard: '#16213E',
  bgCardRaised: '#1E2A4A',
  bgPanel: '#221B3D',
  bgInset: '#11162B',
  bgInput: '#1E2A4A',
  bgModal: '#0D0D1A',

  // Text
  textPrimary: '#E8E8F0',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textAccent: '#C4A962',
  textSoft: '#C7CDD9',

  // Accents
  gold: '#C4A962',
  goldLight: '#D4B872',
  goldBright: '#F1DEA1',
  goldDark: '#A48942',
  goldGlow: 'rgba(196, 169, 98, 0.18)',
  goldSoft: 'rgba(196, 169, 98, 0.1)',
  starlight: 'rgba(240, 232, 196, 0.65)',
  veil: 'rgba(9, 11, 20, 0.72)',
  amethyst: '#7C5CFC',
  amethystGlow: 'rgba(124, 92, 252, 0.25)',
  sapphire: '#4E82FF',
  moon: '#B7C8FF',
  rose: '#E879B8',

  // Stat colors
  strength: '#EF4444',
  vitality: '#22C55E',
  intelligence: '#3B82F6',
  charisma: '#F59E0B',
  dexterity: '#8B5CF6',
  willpower: '#EC4899',

  // UI
  border: '#2A2A4A',
  borderLight: '#3A3A5A',
  borderStrong: '#60547A',
  borderGlow: 'rgba(196, 169, 98, 0.34)',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  shadowHeavy: 'rgba(5, 8, 20, 0.45)',
  bgGlass: 'rgba(17, 22, 43, 0.55)',
  bgGlassStrong: 'rgba(13, 18, 34, 0.8)',

  // Tab bar
  tabActive: '#C4A962',
  tabInactive: '#6B7280',
  tabBg: '#0A0A14',
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
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
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
  body: {
    fontFamily: fonts.body,
    letterSpacing: 0.15,
  },
  bodyStrong: {
    fontFamily: fonts.body,
    letterSpacing: 0.15,
    fontWeight: '600' as const,
  },
  journal: {
    fontFamily: fonts.journal,
    letterSpacing: 0.25,
  },
  overline: {
    fontFamily: fonts.heading,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
  },
};
