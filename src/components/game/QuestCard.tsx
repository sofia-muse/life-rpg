import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Quest, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { Card } from '../layout/Card';

interface Props {
  quest: Quest;
  onComplete: (questId: string) => void;
  onDelete?: (questId: string) => void;
}

export function QuestCard({ quest, onComplete, onDelete }: Props) {
  const statColor = STAT_COLORS[quest.stat];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (quest.isCompleted) return;
    // Bounce effect on complete
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onComplete(quest.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Card style={[styles.card, quest.isCompleted ? styles.completed : undefined]}>
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.left}>
            <View
              style={[
                styles.checkbox,
                quest.isCompleted && { backgroundColor: statColor, borderColor: statColor },
              ]}
            >
              {quest.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.title, quest.isCompleted && styles.titleCompleted]}>
              {quest.title}
            </Text>
            {quest.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {quest.description}
              </Text>
            ) : null}
            <View style={styles.meta}>
              <Text style={styles.statBadge}>
                {STAT_ICONS[quest.stat]} {quest.stat}
              </Text>
              <Text style={[styles.xpBadge, { color: statColor }]}>+{quest.xpReward} XP</Text>
              {quest.streak > 0 && <Text style={styles.streak}>🔥 {quest.streak}</Text>}
            </View>
          </View>

          {quest.type === 'boss' && quest.totalSteps && (
            <View style={styles.bossProgress}>
              <Text style={styles.bossText}>
                {quest.completedSteps || 0}/{quest.totalSteps}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {onDelete && !quest.isCompleted && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(quest.id)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  completed: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    marginRight: spacing.sm + 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.bgPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  statBadge: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  xpBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  streak: {
    color: colors.warning,
    fontSize: fontSize.xs,
  },
  bossProgress: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bossText: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
