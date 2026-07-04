import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/layout/Card';
import { EmptyState } from '../../src/components/layout/EmptyState';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { colors, fontSize, radius, spacing } from '../../src/config/theme';
import { useHeroStore } from '../../src/store/heroStore';
import { useJournalStore } from '../../src/store/journalStore';
import { STAT_COLORS, STAT_ICONS, StatName } from '../../src/types';

export default function JournalScreen() {
  const { entries } = useJournalStore();
  const hero = useHeroStore((s) => s.hero);

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
      <ScreenHeader
        eyebrow="Legend Archive"
        title="Journal"
        subtitle="A codex of quests honored, levels gained, and the moments that turned into class identity."
      />

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Chronicle Status</Text>
        <Text style={styles.summaryTitle}>{hero ? `${hero.name}'s archive` : 'A fresh archive'}</Text>
        <Text style={styles.summaryText}>
          {entries.length > 0
            ? `${entries.length} chapter${entries.length === 1 ? '' : 's'} recorded so far. Each completed quest writes into the legend.`
            : 'No chapters written yet. Complete a first quest to begin the legend.'}
        </Text>
      </Card>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <Text style={styles.chapterLabel}>Chapter {entries.length - entries.indexOf(item)}</Text>
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
          <EmptyState
            icon="📖"
            title="Your journal awaits..."
            message="Complete quests to fill its pages with the story of your adventures."
          />
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryEyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  entryCard: {
    marginBottom: spacing.md,
  },
  chapterLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    fontWeight: '700',
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
});
