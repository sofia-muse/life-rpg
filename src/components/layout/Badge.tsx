import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '../../config/theme';

interface Props {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, color = colors.gold, size = 'md', style }: Props) {
  return (
    <View style={[styles.badge, { borderColor: color }, size === 'sm' && styles.sm, style]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  textSm: {
    fontSize: fontSize.xs,
  },
});
