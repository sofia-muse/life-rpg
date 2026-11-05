import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing } from '../../config/theme';
import { StoryFrame } from './StoryFrame';
import { LinearGradient } from 'expo-linear-gradient';

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
      <LinearGradient
        pointerEvents="none"
        colors={['#1B382C', '#10271F']}
        style={StyleSheet.absoluteFillObject}
      />
      <StoryFrame />
      <View style={padded && styles.padded}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#796C47',
    overflow: 'hidden',
  },
  accent: { borderColor: colors.borderStrong, backgroundColor: colors.bgPanel },
  padded: { padding: spacing.lg },
});
