import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { WeeklyContract } from '../../config/classContracts';
import { STAT_COLORS } from '../../types';

interface Props {
  contract: WeeklyContract;
}

export function ContractHeader({ contract }: Props) {
  const progress = Math.min(contract.completedMatches / contract.requiredCount, 1);
  const accentColor = STAT_COLORS[contract.stats[0]];

  return (
    <Card style={styles.card}>
      <Text style={styles.overline}>
        {contract.kind === 'weeklyPath' ? 'Weekly Contract' : 'Class Contract'}
      </Text>
      <Text style={styles.title}>{contract.title}</Text>
      <Text style={styles.vow}>&ldquo;{contract.vow}&rdquo;</Text>
      <Text style={styles.summary}>{contract.summary}</Text>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressValue, { color: accentColor }]}>
            {contract.completedMatches}/{contract.requiredCount}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
      </View>

      {contract.recommended.length > 0 && (
        <View style={styles.recommended}>
          <Text style={styles.recommendedLabel}>Recommended quests</Text>
          <View style={styles.recommendedRow}>
            {contract.recommended.slice(0, 4).map((template) => (
              <View key={`${template.type}-${template.title}`} style={styles.recommendedChip}>
                <Text style={styles.recommendedChipText} numberOfLines={1}>
                  {template.title}
                </Text>
              </View>
            ))}
          </View>
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
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.sm,
    ...typography.heading,
  },
  vow: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.sm,
    ...typography.journal,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginBottom: spacing.md,
    ...typography.body,
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
    borderRadius: 4,
  },
  recommended: {},
  recommendedLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    ...typography.headingWide,
  },
  recommendedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recommendedChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
    maxWidth: '48%',
  },
  recommendedChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
