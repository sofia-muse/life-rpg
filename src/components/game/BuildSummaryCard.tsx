import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, typography } from '../../config/theme';
import { Hero, Quest, StatName, STAT_COLORS, STAT_ICONS, STAT_NAMES } from '../../types';
import { getHeroStreakMultiplier } from '../../engine/streakEngine';
import { getWeeklyPathQuestBonus, WeeklyPathSettingsLike } from '../../config/weeklyPaths';
import { getQuestSkillBonus } from '../../engine/skillEngine';

interface Props {
  hero: Hero;
  settings: WeeklyPathSettingsLike;
  unlockedSkillIds: string[];
  forgedSkillCount: number;
  sampleQuest?: Quest;
  onRespec?: (stat: StatName) => void;
}

export function BuildSummaryCard({
  hero,
  settings,
  unlockedSkillIds,
  forgedSkillCount,
  sampleQuest,
  onRespec,
}: Props) {
  const streakMult = getHeroStreakMultiplier(hero.currentStreak);
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
        <Text style={styles.forged}>
          ✨ {forgedSkillCount} forged skill{forgedSkillCount > 1 ? 's' : ''} · 3 can be equipped
        </Text>
      )}

      {onRespec && (
        <View style={styles.respecRow}>
          {STAT_NAMES.map((stat) => {
            const selected = stat === hero.dominantStat;
            return (
              <TouchableOpacity
                key={stat}
                onPress={() => onRespec(stat)}
                style={[styles.respecChip, selected && { borderColor: STAT_COLORS[stat] }]}
              >
                <Text style={[styles.respecText, { color: STAT_COLORS[stat] }]}>
                  {STAT_ICONS[stat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  respecRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  respecChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  respecText: {
    fontSize: fontSize.md,
  },
});
