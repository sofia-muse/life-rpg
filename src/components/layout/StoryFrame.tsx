import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';
import { PanelCorner } from './PanelCorner';

/** Decorative only: the border never owns touches, focus, or screen-reader content. */
export function StoryFrame({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  const color = dark ? '#544021' : colors.gold;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
    >
      <View
        style={[
          styles.rule,
          compact && styles.compactRule,
          { borderColor: dark ? '#72572F' : '#776B44' },
        ]}
      />
      {[0, 1, 2, 3].map((corner) => (
        <View
          key={corner}
          style={[
            styles.corner,
            corner === 0
              ? { top: 3, left: 3 }
              : corner === 1
                ? { top: 3, right: 3 }
                : corner === 2
                  ? { bottom: 3, right: 3 }
                  : { bottom: 3, left: 3 },
            { transform: [{ rotate: `${corner * 90}deg` }] },
          ]}
        >
          <PanelCorner size={compact ? 17 : 32} color={color} />
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  rule: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderWidth: 1,
    borderRadius: 8,
    opacity: 0.5,
  },
  compactRule: { top: 3, bottom: 3, left: 3, right: 3, borderRadius: 5 },
  corner: { position: 'absolute' },
});
