import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { StatName, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  stat: StatName;
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
}

export function StatBar({ stat, level, currentXP, xpNeeded, progress }: Props) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const statColor = STAT_COLORS[stat];

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statInfo}>
          <Text style={styles.icon}>{STAT_ICONS[stat]}</Text>
          <Text style={styles.statName}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</Text>
        </View>
        <Text style={[styles.level, { color: statColor }]}>Lv. {level}</Text>
      </View>

      <View style={styles.barBg}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: statColor, width: widthInterpolation }]}
        />
      </View>

      <Text style={styles.xpText}>
        {currentXP} / {xpNeeded} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  statName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  level: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  barBg: {
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'right',
  },
});
