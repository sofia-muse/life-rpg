import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { Card } from '../../src/components/layout/Card';
import { EmptyState } from '../../src/components/layout/EmptyState';
import { PageHeader } from '../../src/components/layout/PageHeader';
import { useJournalStore } from '../../src/store/journalStore';
import { colors, spacing, fontSize, radius, typography } from '../../src/config/theme';
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
    <ScreenWrapper scroll={false} contentWidth="regular">
      <PageHeader
        eyebrow="Chronicle"
        title="Journal"
        subtitle="A living record of the quests, victories, and lessons that shaped your hero."
      />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <View style={styles.entryTopRow}>
              <View style={styles.entryMarker} />
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>

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
  list: {
    paddingBottom: spacing.xxl,
  },
  entryCard: {
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  date: {
    ...typography.eyebrow,
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  narrative: {
    ...typography.journalItalic,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    lineHeight: 28,
    marginBottom: spacing.md,
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
    backgroundColor: colors.bgInset,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
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
    gap: spacing.xs,
  },
  milestone: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  skillUnlock: {
    ...typography.eyebrow,
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
