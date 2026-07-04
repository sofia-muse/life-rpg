import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Quest, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { Card } from '../layout/Card';
import { getBossSagaState, getQuestEvolutionState } from '../../engine/questProgression';

interface Props {
  quest: Quest;
  onComplete: (questId: string) => void;
  onDelete?: (questId: string) => void;
  highlighted?: boolean;
}

const TYPE_LABELS = {
  daily: 'Daily Rite',
  side: 'Side Contract',
  boss: 'Boss Saga',
} as const;

export function QuestCard({ quest, onComplete, onDelete, highlighted = false }: Props) {
  const statColor = STAT_COLORS[quest.stat];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const saga = getBossSagaState(quest);
  const evolution = getQuestEvolutionState(quest);
  const bossProgress = quest.type === 'boss' && quest.totalSteps ? (quest.completedSteps || 0) / quest.totalSteps : 0;

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
      <Card
        style={[
          styles.card,
          quest.isCompleted ? styles.completed : undefined,
          highlighted ? { borderColor: `${statColor}80` } : undefined,
        ]}
      >
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
            <View style={styles.topRow}>
              <View style={[styles.typePill, { borderColor: `${statColor}55` }]}>
                <Text style={[styles.typePillText, { color: statColor }]}>{TYPE_LABELS[quest.type]}</Text>
              </View>
              {highlighted && <Text style={styles.highlightTag}>aligned</Text>}
            </View>
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

            {evolution && quest.type === 'daily' && !quest.isCompleted && (
              <View style={styles.progressPanel}>
                <Text style={styles.progressTitle}>
                  {evolution.rankName} path · stage {evolution.currentStageIndex + 1}/{evolution.totalStages}
                </Text>
                <Text style={styles.progressText}>
                  {evolution.nextTitle
                    ? `${Math.max((evolution.nextUnlockAt ?? 0) - quest.daysCompleted, 0)} more clears to unlock ${evolution.nextTitle}`
                    : 'Final rank reached for this ritual'}
                </Text>
              </View>
            )}

            {saga && quest.type === 'boss' && (
              <View style={styles.progressPanel}>
                <Text style={styles.progressTitle}>{saga.sagaTitle}</Text>
                <Text style={styles.progressText}>
                  {saga.currentPhase}
                  {saga.nextPhase ? ` -> ${saga.nextPhase}` : ' -> final triumph'}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${bossProgress * 100}%`, backgroundColor: statColor }]} />
                </View>
              </View>
            )}
          </View>

          {quest.type === 'boss' && quest.totalSteps && (
            <View style={[styles.bossProgress, { borderColor: `${statColor}40` }]}>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typePill: {
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(15, 15, 26, 0.45)',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  typePillText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  highlightTag: {
    color: colors.goldBright,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
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
  progressPanel: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.45)',
    padding: spacing.sm,
  },
  progressTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
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
    borderWidth: 1,
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
