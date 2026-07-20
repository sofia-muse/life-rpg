import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, typography } from '../../config/theme';
import { Hero, STAT_COLORS, STAT_ICONS } from '../../types';
import { getStreakMultiplier } from '../../engine/streakEngine';
import { getWeeklyPathQuestBonus, WeeklyPathSettingsLike } from '../../config/weeklyPaths';
import { getQuestSkillBonus } from '../../engine/skillEngine';
import { Quest } from '../../types';

interface Props {
  hero: Hero;
  settings: WeeklyPathSettingsLike;
  unlockedSkillIds: string[];
  forgedSkillCount: number;
  sampleQuest?: Quest;
}

export function BuildSummaryCard({
  hero,
  settings,
  unlockedSkillIds,
  forgedSkillCount,
  sampleQuest,
}: Props) {
  const streakMult = getStreakMultiplier(hero.currentStreak);
  const skillBonus = sampleQuest
    ? getQuestSkillBonus(sampleQuest, unlockedSkillIds)
    : 0;
  const pathBonus = sampleQuest
    ? getWeeklyPathQuestBonus(settings, sampleQuest)
    : 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.overline}>Character Sheet</Text>
      <Text style={styles.title}>{hero.name}</Text>
      <Text style={styles.classLine}>
        {STAT_ICONS[hero.dominantStat]} {hero.className} · Tier {hero.classTier} · Lv.{hero.heroLevel}
      </Text>

      <View style={styles.grid}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streakMult.toFixed(1)}×</Text>
          <Text style={styles.statLabel}>Streak Mult</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{unlockedSkillIds.length}</Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: STAT_COLORS[hero.dominantStat] }]}>
            +{skillBonus}%
          </Text>
          <Text style={styles.statLabel}>Skill Bonus</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>+{pathBonus}%</Text>
          <Text style={styles.statLabel}>Path Bonus</Text>
        </View>
      </View>

      {forgedSkillCount > 0 && (
        <Text style={styles.forged}>✨ {forgedSkillCount} forged skill{forgedSkillCount > 1 ? 's' : ''} active</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  overline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
    ...typography.heading,
  },
  classLine: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.bgInset,
  },
  statValue: {
    color: colors.goldBright,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  forged: {
    color: colors.gold,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
