import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'default' | 'accent';
}

/** Quiet reading surfaces keep illustration away from task text. */
export function Card({ children, style, padded = true, tone = 'default' }: Props) {
  return (
    <View style={[styles.card, tone === 'accent' && styles.accent, style]}>
      <View style={padded && styles.padded}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accent: { borderColor: colors.borderStrong, backgroundColor: colors.bgPanel },
  padded: { padding: spacing.lg },
});
