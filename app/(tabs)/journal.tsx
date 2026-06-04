import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Card } from '../../src/components/layout/Card';
import { useJournalStore } from '../../src/store/journalStore';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { STAT_ICONS, STAT_COLORS, StatName } from '../../src/types';

export default function JournalScreen() {
  const { entries } = useJournalStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.subtitle}>A chronicle of your adventures</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>

            {item.narrative ? <Text style={styles.narrative}>{item.narrative}</Text> : null}

            {/* XP Summary */}
            {Object.entries(item.xpGained).some(([_, v]) => v > 0) && (
              <View style={styles.xpRow}>
                {Object.entries(item.xpGained).map(([stat, xp]) => {
                  if (xp === 0) return null;
                  const s = stat as StatName;
                  return (
                    <View key={stat} style={styles.xpChip}>
                      <Text style={styles.xpIcon}>{STAT_ICONS[s]}</Text>
                      <Text style={[styles.xpValue, { color: STAT_COLORS[s] }]}>+{xp}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Milestones */}
            {item.levelsGained.length > 0 && (
              <View style={styles.milestones}>
                {item.levelsGained.map((stat, i) => (
                  <Text key={i} style={styles.milestone}>
                    🎉 {stat.charAt(0).toUpperCase() + stat.slice(1)} leveled up!
                  </Text>
                ))}
              </View>
            )}

            {item.skillsUnlocked.length > 0 && (
              <Text style={styles.skillUnlock}>
                ✨ {item.skillsUnlocked.length} skill{item.skillsUnlocked.length > 1 ? 's' : ''}{' '}
                unlocked
              </Text>
            )}
          </Card>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>Your journal awaits...</Text>
            <Text style={styles.emptyHint}>Complete quests to fill its pages.</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  entryCard: {
    marginBottom: spacing.md,
  },
  date: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  narrative: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  xpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  xpIcon: {
    fontSize: 12,
  },
  xpValue: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  milestones: {
    marginTop: spacing.sm,
  },
  milestone: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  skillUnlock: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.xl,
    fontStyle: 'italic',
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
