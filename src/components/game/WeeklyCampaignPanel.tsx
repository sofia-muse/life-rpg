import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../layout/Card';
import { Badge } from '../layout/Badge';
import { Button } from '../layout/Button';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { Hero, WeeklyPath } from '../../types';
import {
  WEEKLY_PATHS,
  getActiveWeeklyPath,
  buildWeeklyCupSummary,
  WeeklyPathSettingsLike,
} from '../../config/weeklyPaths';
import { getPrimaryContract, isContractComplete } from '../../config/classContracts';
import { getRewardStatusCopy } from '../../config/weeklyCompetition';
import { getWeeklyCapacityBonus } from '../../engine/skillEngine';
import { useSkillStore } from '../../store/skillStore';
import { Quest } from '../../types';

interface Props {
  hero: Hero;
  settings: WeeklyPathSettingsLike;
  quests: Quest[];
  onChoosePath: (path: WeeklyPath) => void;
  onClaimReward: (reward: { title: string; badge: string }) => void;
}

const CUP_RANK_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: colors.gold,
  mythic: colors.amethyst,
} as const;

export function WeeklyCampaignPanel({
  hero,
  settings,
  quests,
  onChoosePath,
  onClaimReward,
}: Props) {
  const activePath = getActiveWeeklyPath(settings);
  const capacityBonus = getWeeklyCapacityBonus(useSkillStore.getState().getUnlockedSkillIds());
  const contract = getPrimaryContract(hero, settings, quests, capacityBonus);
  const cup = activePath
    ? buildWeeklyCupSummary(
        settings,
        quests,
        hero.currentStreak,
        contract.completedMatches,
        contract.requiredCount,
      )
    : null;
  const rewardStatus = getRewardStatusCopy(contract, settings);
  const progress = Math.min(contract.completedMatches / contract.requiredCount, 1);

  if (!activePath) {
    return (
      <Card style={styles.card}>
        <Text style={styles.overline}>This Week&apos;s Campaign</Text>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.subtitle}>
          Each week, pledge to Power, Focus, or Support. Your path shapes your contract and XP bonus.
        </Text>
        <View style={styles.pathRow}>
          {(Object.keys(WEEKLY_PATHS) as WeeklyPath[]).map((path) => {
            const def = WEEKLY_PATHS[path];
            return (
              <TouchableOpacity
                key={path}
                style={styles.pathChip}
                onPress={() => onChoosePath(path)}
                activeOpacity={0.85}
              >
                <Text style={styles.pathLabel}>{def.label}</Text>
                <Text style={styles.pathFocus} numberOfLines={2}>
                  {def.focus}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    );
  }

  const pathDef = WEEKLY_PATHS[activePath];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.overline}>This Week&apos;s Campaign</Text>
          <Text style={styles.title}>{pathDef.label} Path</Text>
        </View>
        {cup && (
          <Badge
            label={`${cup.label} · ${cup.score}`}
            color={CUP_RANK_COLORS[cup.rank]}
          />
        )}
      </View>

      <Text style={styles.vow}>&ldquo;{pathDef.vow}&rdquo;</Text>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Contract Progress</Text>
          <Text style={styles.progressValue}>
            {contract.completedMatches}/{contract.requiredCount}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {cup && (
        <View style={styles.cupRow}>
          <View style={styles.cupStat}>
            <Text style={styles.cupStatValue}>{cup.contractProgress}</Text>
            <Text style={styles.cupStatLabel}>Contract</Text>
          </View>
          <View style={styles.cupStat}>
            <Text style={styles.cupStatValue}>{cup.bossProgress}</Text>
            <Text style={styles.cupStatLabel}>Boss Arc</Text>
          </View>
          <View style={styles.cupStat}>
            <Text style={styles.cupStatValue}>{cup.streakBoost}</Text>
            <Text style={styles.cupStatLabel}>Streak</Text>
          </View>
          <View style={styles.cupStat}>
            <Text style={[styles.cupStatValue, { color: CUP_RANK_COLORS[cup.rank] }]}>
              {cup.rank}
            </Text>
            <Text style={styles.cupStatLabel}>Rank</Text>
          </View>
        </View>
      )}

      {rewardStatus.readyToClaim ? (
        <Button
          title={`Claim: ${rewardStatus.label}`}
          onPress={() =>
            onClaimReward({ title: contract.reward.title, badge: contract.reward.badge })
          }
          style={styles.claimBtn}
        />
      ) : (
        <Text style={styles.rewardChase}>
          Reward chase: {rewardStatus.label}
          {isContractComplete(contract) ? '' : ` · ${contract.requiredCount - contract.completedMatches} quests to go`}
        </Text>
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    ...typography.body,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerCopy: { flex: 1 },
  vow: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.md,
    ...typography.journal,
  },
  pathRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pathChip: {
    flex: 1,
    minWidth: 100,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
  },
  pathLabel: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  pathFocus: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  progressBlock: { marginBottom: spacing.md },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    ...typography.headingWide,
  },
  progressValue: {
    color: colors.goldBright,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  cupRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cupStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgInset,
  },
  cupStatValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  cupStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  claimBtn: { marginTop: spacing.xs },
  rewardChase: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    ...typography.body,
    fontWeight: '600',
  },
});
