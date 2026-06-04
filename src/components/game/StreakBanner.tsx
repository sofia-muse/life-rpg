import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import {
  getStreakMultiplier,
  getCurrentMilestone,
  daysUntilNextMilestone,
} from '../../engine/streakEngine';

interface Props {
  streakDays: number;
}

export function StreakBanner({ streakDays }: Props) {
  const multiplier = getStreakMultiplier(streakDays);
  const currentMilestone = getCurrentMilestone(streakDays);
  const daysToNext = daysUntilNextMilestone(streakDays);

  const fireScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streakDays === 0) return;
    // Fire icon bounce loop
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(fireScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(fireScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    bounce.start();
    return () => bounce.stop();
  }, [streakDays]);

  if (streakDays === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Complete a quest to start your streak!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.Text style={[styles.fire, { transform: [{ scale: fireScale }] }]}>
          🔥
        </Animated.Text>
        <Text style={styles.count}>{streakDays}</Text>
        <Text style={styles.label}>day streak</Text>
        {multiplier > 1 && (
          <View style={styles.multiplier}>
            <Text style={styles.multiplierText}>x{multiplier}</Text>
          </View>
        )}
      </View>
      {currentMilestone && <Text style={styles.milestone}>{currentMilestone.title}</Text>}
      {daysToNext !== null && (
        <Text style={styles.next}>
          {daysToNext} day{daysToNext !== 1 ? 's' : ''} to next milestone
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fire: {
    fontSize: 24,
    marginRight: spacing.xs,
  },
  count: {
    color: colors.warning,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    marginRight: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    flex: 1,
  },
  multiplier: {
    backgroundColor: `${colors.warning}30`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  multiplierText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  milestone: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  next: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
