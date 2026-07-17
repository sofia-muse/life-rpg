import React, { useEffect, useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/layout/Card';
import { EmptyState } from '../../src/components/layout/EmptyState';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { colors, fontSize, radius, spacing, typography } from '../../src/config/theme';
import { useJournalStore } from '../../src/store/journalStore';
import { useHeroStore } from '../../src/store/heroStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { STAT_COLORS, STAT_ICONS, StatName } from '../../src/types';
import { getCurrentWeekKey } from '../../src/config/weeklyPaths';
import { STREAK_MILESTONES } from '../../src/engine/streakEngine';
import { guidanceApi, ChronicleDto } from '../../src/api/guidanceApi';
import { env } from '../../src/config/env';
import { generateDailySummary } from '../../src/engine/journalEngine';
import { useQuestStore } from '../../src/store/questStore';

function getCampaignDay(createdAt: string, entryDate: string): number {
  const start = new Date(createdAt);
  const entry = new Date(entryDate);
  start.setHours(0, 0, 0, 0);
  entry.setHours(0, 0, 0, 0);
  const diff = Math.floor((entry.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

function getWeekLabel(dateStr: string): string {
  const weekKey = getCurrentWeekKey(new Date(dateStr));
  return `Chapter Week of ${weekKey}`;
}

export default function JournalScreen() {
  const { entries } = useJournalStore();
  const hero = useHeroStore((s) => s.hero);
  const settings = useSettingsStore();
  const { quests } = useQuestStore();
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const canUseChronicle = settings.aiSkillsEnabled && !env.demoMode && authenticated;
  const [chronicle, setChronicle] = useState<ChronicleDto | null>(null);

  useEffect(() => {
    if (!canUseChronicle) return;
    void guidanceApi
      .getChronicle()
      .then(setChronicle)
      .catch(() => setChronicle(null));
  }, [canUseChronicle]);

  const groupedEntries = useMemo(() => {
    const groups: { weekKey: string; label: string; items: typeof entries }[] = [];
    for (const entry of entries) {
      const weekKey = getCurrentWeekKey(new Date(entry.date));
      let group = groups.find((g) => g.weekKey === weekKey);
      if (!group) {
        group = { weekKey, label: getWeekLabel(entry.date), items: [] };
        groups.push(group);
      }
      group.items.push(entry);
    }
    return groups;
  }, [entries]);

  const streakMilestones = hero
    ? STREAK_MILESTONES.filter((m) => hero.longestStreak >= m.days)
    : [];

  const offlineEpilogue =
    hero && entries.length > 0
      ? generateDailySummary(
          quests.filter((q) => q.isCompleted),
          entries[0]?.xpGained ?? {},
          entries[0]?.levelsGained ?? [],
          entries[0]?.skillsUnlocked ?? [],
          hero.currentStreak,
        )
      : null;

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.title}>Chronicle</Text>
      <Text style={styles.subtitle}>A living record of your campaign</Text>

      {(chronicle || offlineEpilogue) && (
        <Card style={styles.chronicleCard}>
          <Text style={styles.chronicleOverline}>
            {chronicle ? 'Weekly Chronicle' : 'Campaign Epilogue'}
          </Text>
          <Text style={styles.chronicleTitle}>
            {chronicle?.title ?? `${hero?.name}'s Recent Deeds`}
          </Text>
          <Text style={styles.chronicleNarrative}>
            {chronicle?.narrative ?? offlineEpilogue}
          </Text>
          {chronicle?.highlights.map((h, i) => (
            <Text key={i} style={styles.chronicleHighlight}>
              • {h}
            </Text>
          ))}
        </Card>
      )}

      {streakMilestones.length > 0 && (
        <Card style={styles.stampsCard}>
          <Text style={styles.stampsTitle}>Milestone Stamps</Text>
          <View style={styles.stampsRow}>
            {streakMilestones.map((m) => (
              <View key={m.days} style={styles.stamp}>
                <Text style={styles.stampIcon}>🔥</Text>
                <Text style={styles.stampLabel}>{m.title}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <FlatList
        data={groupedEntries}
        keyExtractor={(item) => item.weekKey}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.chapterHeader}>{group.label}</Text>
            {group.items.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <Text style={styles.date}>
                  {hero
                    ? `Day ${getCampaignDay(hero.createdAt, entry.date)} — ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
                    : new Date(entry.date).toLocaleDateString()}
                </Text>

                {entry.narrative ? (
                  <Text style={styles.narrative}>{entry.narrative}</Text>
                ) : null}

                {Object.entries(entry.xpGained).some(([_, v]) => v > 0) && (
                  <View style={styles.xpRow}>
                    {Object.entries(entry.xpGained).map(([stat, xp]) => {
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

                {entry.levelsGained.length > 0 && (
                  <View style={styles.milestones}>
                    {entry.levelsGained.map((stat, i) => (
                      <Text key={i} style={styles.milestone}>
                        🎉 {stat.charAt(0).toUpperCase() + stat.slice(1)} leveled up!
                      </Text>
                    ))}
                  </View>
                )}

                {entry.milestones.length > 0 && (
                  <View style={styles.milestones}>
                    {entry.milestones.map((m, i) => (
                      <Text key={i} style={styles.milestone}>
                        🏅 {m}
                      </Text>
                    ))}
                  </View>
                )}

                {entry.skillsUnlocked.length > 0 && (
                  <Text style={styles.skillUnlock}>
                    ✨ {entry.skillsUnlocked.length} skill
                    {entry.skillsUnlocked.length > 1 ? 's' : ''} unlocked
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📖"
            title="Your chronicle awaits..."
            message="Complete quests to fill its pages with the story of your adventures."
          />
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
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
    ...typography.journal,
  },
  chronicleCard: { marginBottom: spacing.md },
  chronicleOverline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  chronicleTitle: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  chronicleNarrative: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    ...typography.journal,
  },
  chronicleHighlight: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  stampsCard: { marginBottom: spacing.md },
  stampsTitle: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  stampsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stamp: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgInset,
    minWidth: 80,
  },
  stampIcon: { fontSize: 20 },
  stampLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  chapterHeader: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  list: { paddingBottom: spacing.xxl },
  entryCard: { marginBottom: spacing.md },
  date: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    ...typography.headingWide,
  },
  narrative: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
    ...typography.journal,
  },
  xpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  xpIcon: { fontSize: 12 },
  xpValue: { fontSize: fontSize.sm, fontWeight: '700' },
  milestones: { gap: spacing.xs, marginBottom: spacing.sm },
  milestone: { color: colors.gold, fontSize: fontSize.sm, fontWeight: '600' },
  skillUnlock: { color: colors.textAccent, fontSize: fontSize.sm, fontStyle: 'italic' },
});
