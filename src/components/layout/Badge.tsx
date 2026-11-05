import { Text } from './StoryText';
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, typography } from '../../config/theme';

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
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: 5,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
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
    borderRadius: 5,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    fontSize: fontSize.sm,
    lineHeight: 20,
    ...typography.body,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
});
