import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '../layout/Badge';
import { Button } from '../layout/Button';
import { Card } from '../layout/Card';
import { colors, fontSize, radius, spacing, typography } from '../../config/theme';
import {
  WEEKLY_PATHS,
  buildWeeklyCupSummary,
  getActiveWeeklyPath,
  getWeeklyPathDefinition,
} from '../../config/weeklyPaths';
import { getPrimaryContract } from '../../config/classContracts';
import { getRewardStatusCopy } from '../../config/weeklyCompetition';
import { useHeroStore } from '../../store/heroStore';
import { useQuestStore } from '../../store/questStore';
import { useSettingsStore } from '../../store/settingsStore';
import { WeeklyPath } from '../../types';

interface Props {
  variant?: 'compact' | 'full';
  onOpenQuests?: () => void;
}

const PATH_ICONS: Record<WeeklyPath, string> = {
  power: '⚔',
  focus: '✦',
  support: '🛡',
};

const RANK_COLORS = {
  bronze: colors.warning,
  silver: '#CBD5E1',
  gold: colors.goldBright,
  mythic: colors.amethyst,
} as const;

export function WeeklyContractPanel({ variant = 'full', onOpenQuests }: Props) {
  const hero = useHeroStore((s) => s.hero);
  const quests = useQuestStore((s) => s.quests);
  const settings = useSettingsStore();
  const chooseWeeklyPath = useSettingsStore((s) => s.chooseWeeklyPath);
  const claimWeeklyReward = useSettingsStore((s) => s.claimWeeklyReward);

  if (!hero) {
    return null;
  }

  const activePath = getActiveWeeklyPath(settings);
  const activePathDefinition = activePath ? getWeeklyPathDefinition(activePath) : null;
  const contract = getPrimaryContract(hero, settings, quests);
  const rewardStatus = getRewardStatusCopy(contract, settings);
  const cup = buildWeeklyCupSummary(
    settings,
    quests,
    hero.currentStreak,
    contract.completedMatches,
    contract.requiredCount,
  );
  const progress = Math.min(contract.completedMatches / Math.max(contract.requiredCount, 1), 1);
  const compact = variant === 'compact';
  const recommendations = contract.recommended.slice(0, compact ? 2 : 4);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Weekly Campaign</Text>
          <Text style={styles.title}>{contract.title}</Text>
          <Text style={styles.subtitle}>
            {activePathDefinition
              ? `${activePathDefinition.label} path is active. ${contract.summary}`
              : `Choose a path to turn this week into a focused campaign. ${contract.summary}`}
          </Text>
        </View>
        <View style={styles.badgeColumn}>
          <Badge label={contract.kind === 'weeklyPath' ? 'Weekly Path' : 'Class Contract'} color={colors.gold} />
          {cup ? (
            <Badge
              label={`${cup.label} · ${cup.rank}`}
              color={RANK_COLORS[cup.rank]}
              style={styles.badgeSpacing}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.progressShell}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Contract progress</Text>
          <Text style={styles.progressValue}>
            {contract.completedMatches}/{contract.requiredCount}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{hero.currentStreak}</Text>
          <Text style={styles.metricLabel}>Current streak</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{contract.activeMatches}</Text>
          <Text style={styles.metricLabel}>Active aligned quests</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{cup ? `${cup.score}` : '+5%'}</Text>
          <Text style={styles.metricLabel}>{cup ? 'Cup score' : 'Path bonus'}</Text>
        </View>
      </View>

      {activePathDefinition ? (
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutIcon}>{PATH_ICONS[activePathDefinition.id]}</Text>
            <View style={styles.calloutCopy}>
              <Text style={styles.calloutTitle}>{activePathDefinition.label} Path</Text>
              <Text style={styles.calloutText}>{activePathDefinition.vow}</Text>
            </View>
          </View>
          {cup ? (
            <Text style={styles.calloutFoot}>
              Rank {cup.rank.toUpperCase()} with {cup.contractProgress} contract points, {cup.bossProgress} boss
              points, and {cup.streakBoost} streak points.
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.pathsWrap}>
          {Object.values(WEEKLY_PATHS).map((path) => (
            <TouchableOpacity
              key={path.id}
              style={styles.pathChoice}
              activeOpacity={0.85}
              onPress={() => chooseWeeklyPath(path.id)}
            >
              <Text style={styles.pathChoiceIcon}>{PATH_ICONS[path.id]}</Text>
              <Text style={styles.pathChoiceTitle}>{path.label}</Text>
              <Text style={styles.pathChoiceText}>{path.focus}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.recommendations}>
        <Text style={styles.sectionLabel}>Recommended next quests</Text>
        {recommendations.map((template) => (
          <View key={`${contract.id}-${template.title}`} style={styles.recommendationRow}>
            <Text style={styles.recommendationDot}>✦</Text>
            <Text style={styles.recommendationText}>
              {template.title} · {template.difficulty}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerActions}>
        {rewardStatus.readyToClaim ? (
          <Button
            title={`Claim ${rewardStatus.label}`}
            onPress={() => claimWeeklyReward({ title: contract.reward.title, badge: contract.reward.badge })}
            style={compact ? styles.singleAction : styles.primaryAction}
          />
        ) : (
          <View style={[styles.rewardStatus, compact && styles.rewardStatusCompact]}>
            <Text style={styles.rewardStatusLabel}>Reward chase</Text>
            <Text style={styles.rewardStatusValue}>{rewardStatus.label}</Text>
          </View>
        )}
        {onOpenQuests ? (
          <Button
            title={compact ? 'Open Quest Board' : 'Open Quest Board'}
            onPress={onOpenQuests}
            variant={rewardStatus.readyToClaim ? 'secondary' : 'primary'}
            style={compact ? styles.singleAction : styles.secondaryAction}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    ...typography.body,
  },
  badgeColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    maxWidth: 220,
  },
  badgeSpacing: {
    marginLeft: spacing.xs,
  },
  progressShell: {
    marginTop: spacing.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  progressValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    ...typography.headingWide,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.bgInset,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.gold,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metricValue: {
    color: colors.goldBright,
    fontSize: fontSize.lg,
    ...typography.heading,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    ...typography.body,
  },
  callout: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
    padding: spacing.md,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  calloutIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  calloutCopy: {
    flex: 1,
  },
  calloutTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  calloutText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    ...typography.body,
  },
  calloutFoot: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    lineHeight: 18,
    ...typography.body,
  },
  pathsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pathChoice: {
    flex: 1,
    minWidth: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
    padding: spacing.md,
  },
  pathChoiceIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  pathChoiceTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  pathChoiceText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 17,
    ...typography.body,
  },
  recommendations: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendationDot: {
    color: colors.gold,
    fontSize: fontSize.sm,
  },
  recommendationText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    ...typography.body,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
    minWidth: 180,
  },
  secondaryAction: {
    flex: 1,
    minWidth: 180,
  },
  singleAction: {
    flex: 1,
    minWidth: 190,
  },
  rewardStatus: {
    flex: 1,
    minWidth: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.45)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rewardStatusCompact: {
    minWidth: 190,
  },
  rewardStatusLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  rewardStatusValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    marginTop: 2,
    ...typography.body,
  },
});
