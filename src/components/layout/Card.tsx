import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../../config/theme';
import { PanelCorner } from './PanelCorner';
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
      <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4 }}>
        <PanelCorner />
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: 4, right: 4, transform: [{ rotate: '180deg' }] }}
      >
        <PanelCorner />
      </View>
      <View style={padded && styles.padded}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#796C47',
    overflow: 'hidden',
  },
  accent: { borderColor: colors.borderStrong, backgroundColor: colors.bgPanel },
  padded: { padding: spacing.lg },
});
