import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fontSize, typography } from '../../config/theme';

interface Props {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, color = colors.gold, size = 'md', style }: Props) {
  return (
    <View style={[styles.badge, size === 'sm' && styles.sm, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.innerBorder, { borderColor: `${color}40` }]} />
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  innerBorder: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
});
