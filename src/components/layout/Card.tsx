import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'default' | 'accent';
}

export function Card({ children, style, padded = true, tone = 'default' }: Props) {
  const gradientColors =
    tone === 'accent' ? [colors.bgPanel, colors.bgCardRaised, colors.bgCard] : [colors.bgCardRaised, colors.bgCard];

  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.innerBorder, tone === 'accent' && styles.innerBorderAccent]} />
      <View pointerEvents="none" style={[styles.topAccent, tone === 'accent' && styles.topAccentStrong]} />
      <View pointerEvents="none" style={[styles.glowOrb, tone === 'accent' && styles.glowOrbAccent]} />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  padded: {
    padding: spacing.md,
  },
  innerBorder: {
    position: 'absolute',
    top: 6,
    right: 6,
    bottom: 6,
    left: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  innerBorderAccent: {
    borderColor: colors.borderGlow,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    backgroundColor: colors.goldGlow,
  },
  topAccentStrong: {
    backgroundColor: colors.goldLight,
  },
  glowOrb: {
    position: 'absolute',
    top: -24,
    right: -18,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.goldSoft,
  },
  glowOrbAccent: {
    backgroundColor: colors.amethystGlow,
  },
});
