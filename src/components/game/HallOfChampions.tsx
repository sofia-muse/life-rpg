import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../layout/Card';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { WeeklyCupSummary } from '../../config/weeklyPaths';

export interface HallOfFameEntry {
  weekKey: string;
  heroName: string;
  className: string;
  pathLabel: string;
  cupScore: number;
  cupRank: WeeklyCupSummary['rank'];
  contractTitle: string;
}

interface Props {
  entries: HallOfFameEntry[];
  currentScore?: number;
  currentRank?: WeeklyCupSummary['rank'];
}

const RANK_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: colors.gold,
  mythic: colors.amethyst,
};

export function HallOfChampions({ entries, currentScore, currentRank }: Props) {
  const sorted = [...entries].sort((a, b) => b.cupScore - a.cupScore).slice(0, 10);

  return (
    <Card style={styles.card}>
      <Text style={styles.overline}>Hall of Champions</Text>
      <Text style={styles.title}>Weekly Cup Standings</Text>

      {currentScore !== undefined && currentRank && (
        <View style={styles.currentRow}>
          <Text style={styles.currentLabel}>Your score this week</Text>
          <Text style={[styles.currentScore, { color: RANK_COLORS[currentRank] }]}>
            {currentScore} ({currentRank})
          </Text>
        </View>
      )}

      {sorted.length === 0 ? (
        <Text style={styles.empty}>
          Complete a weekly contract to enter the hall. Your legend starts here.
        </Text>
      ) : (
        sorted.map((entry, index) => (
          <View key={`${entry.weekKey}-${entry.heroName}`} style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{entry.heroName}</Text>
              <Text style={styles.rowMeta}>
                {entry.pathLabel} · {entry.contractTitle}
              </Text>
            </View>
            <Text style={[styles.rowScore, { color: RANK_COLORS[entry.cupRank] }]}>
              {entry.cupScore}
            </Text>
          </View>
        ))
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
    marginBottom: spacing.md,
    ...typography.heading,
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgInset,
    marginBottom: spacing.md,
  },
  currentLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  currentScore: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  rank: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    width: 28,
  },
  rowInfo: { flex: 1 },
  rowName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowScore: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
});
