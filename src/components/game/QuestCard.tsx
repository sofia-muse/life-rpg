import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Quest, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { Card } from '../layout/Card';
import { getQuestEvolutionState, getBossSagaState } from '../../engine/questProgression';
import { getQuestDisplayTitle, getQuestDisplayDescription } from '../../config/questFlavor';

interface Props {
  quest: Quest;
  onComplete: (questId: string) => void;
  onDelete?: (questId: string) => void;
  contractAligned?: boolean;
  useFantasyNames?: boolean;
}

export function QuestCard({
  quest,
  onComplete,
  onDelete,
  contractAligned = false,
  useFantasyNames = false,
}: Props) {
  const statColor = STAT_COLORS[quest.stat];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const evolution = getQuestEvolutionState(quest);
  const saga = getBossSagaState(quest);
  const displayTitle = getQuestDisplayTitle(quest, useFantasyNames);
  const displayDescription = getQuestDisplayDescription(quest, useFantasyNames);

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
          contractAligned ? { borderColor: statColor, borderWidth: 1 } : undefined,
        ]}
      >
        {contractAligned && (
          <View style={[styles.alignedBadge, { backgroundColor: `${statColor}30` }]}>
            <Text style={[styles.alignedText, { color: statColor }]}>Contract Aligned</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.info}>
            {evolution && (
              <View style={styles.rankRow}>
                <Text style={[styles.rankBadge, { color: statColor }]}>{evolution.rankName}</Text>
                {evolution.nextUnlockAt !== undefined && (
                  <Text style={styles.evolutionHint}>
                    Evolves at day {evolution.nextUnlockAt} → {evolution.nextRankName}
                  </Text>
                )}
              </View>
            )}

            {saga && (
              <View style={styles.sagaBlock}>
                <Text style={styles.sagaTitle}>{saga.sagaTitle}</Text>
                <Text style={styles.sagaPhase}>
                  Phase: {saga.currentPhase}
                  {saga.nextPhase ? ` → ${saga.nextPhase}` : ''}
                </Text>
                <Text style={styles.sagaReward}>Relic: {saga.rewardTitle}</Text>
              </View>
            )}

            <Text style={[styles.title, quest.isCompleted && styles.titleCompleted]}>
              {displayTitle}
            </Text>
            {useFantasyNames && quest.title !== displayTitle && (
              <Text style={styles.realTitle}>{quest.title}</Text>
            )}
            {displayDescription ? (
              <Text style={styles.description} numberOfLines={2}>
                {displayDescription}
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
        </View>

        {!quest.isCompleted && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: statColor }]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.claimBtnText}>Claim Victory</Text>
          </TouchableOpacity>
        )}

        {quest.isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>✓ Victorious</Text>
          </View>
        )}

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
    opacity: 0.7,
  },
  alignedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  alignedText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
  },
  rankRow: {
    marginBottom: spacing.xs,
  },
  rankBadge: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  evolutionHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sagaBlock: {
    marginBottom: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInset,
  },
  sagaTitle: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sagaPhase: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  sagaReward: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  realTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
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
    flexWrap: 'wrap',
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
    marginLeft: spacing.sm,
  },
  bossText: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  claimBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  claimBtnText: {
    color: colors.bgPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  completedBanner: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  completedText: {
    color: colors.success,
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
