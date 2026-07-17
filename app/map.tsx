import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Button } from '../src/components/layout/Button';
import { useHeroStore } from '../src/store/heroStore';
import { useQuestStore } from '../src/store/questStore';
import { CAMPAIGN_CHAPTERS, STAT_REGIONS, getChapterForHero } from '../src/config/campaignChapters';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP } from '../src/types';

export default function MapScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const { quests, addQuest } = useQuestStore();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  if (!hero) return null;

  const activeChapter = getChapterForHero(hero.dominantStat);
  const bossQuests = quests.filter((q) => q.type === 'boss' && !q.isCompleted);

  const handleStartChapter = () => {
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === activeChapter.id) ?? activeChapter;
    addQuest({
      title: chapter.bossTemplateTitle,
      description: chapter.narrative,
      type: 'boss',
      difficulty: 'hard',
      stat: chapter.dominantStats[0],
      xpReward: DIFFICULTY_XP.hard,
      isActive: true,
      totalSteps: 30,
      completedSteps: 0,
    });
    router.push('/quests');
  };

  return (
    <ScreenWrapper contentWidth="wide">
      <ScreenHeader
        eyebrow="Campaign Atlas"
        title="World Map"
        subtitle="Six regions of growth. Boss arcs mark the dungeons of your real life."
        action={
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Return</Text>
          </TouchableOpacity>
        }
      />

      <Card style={styles.chapterCard}>
        <Text style={styles.chapterOverline}>Active Chapter</Text>
        <Text style={styles.chapterTitle}>{activeChapter.title}</Text>
        <Text style={styles.chapterSubtitle}>{activeChapter.subtitle}</Text>
        <Text style={styles.chapterNarrative}>{activeChapter.narrative}</Text>
        <Text style={styles.chapterReward}>Reward: {activeChapter.rewardTitle}</Text>
        <Button title="Begin Chapter Boss" onPress={handleStartChapter} style={styles.chapterBtn} />
      </Card>

      <Text style={styles.sectionTitle}>The Six Regions</Text>
      <View style={styles.regionGrid}>
        {STAT_REGIONS.map((region) => {
          const level = hero.stats[region.stat];
          const brightness = Math.min(level / 20, 1);
          const regionBosses = bossQuests.filter((q) => q.stat === region.stat);
          const isSelected = selectedRegion === region.stat;

          return (
            <TouchableOpacity
              key={region.stat}
              style={[
                styles.regionCard,
                { borderColor: STAT_COLORS[region.stat], opacity: 0.5 + brightness * 0.5 },
                isSelected && styles.regionCardSelected,
              ]}
              onPress={() => setSelectedRegion(isSelected ? null : region.stat)}
              activeOpacity={0.85}
            >
              <Text style={styles.regionIcon}>{region.icon}</Text>
              <Text style={styles.regionLabel}>{region.label}</Text>
              <Text style={[styles.regionLevel, { color: STAT_COLORS[region.stat] }]}>
                Lv.{level}
              </Text>
              {regionBosses.length > 0 && (
                <View style={styles.dungeonNode}>
                  <Text style={styles.dungeonText}>🐉 {regionBosses.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedRegion && (
        <Card style={styles.regionDetail}>
          {(() => {
            const region = STAT_REGIONS.find((r) => r.stat === selectedRegion)!;
            return (
              <>
                <Text style={styles.regionDetailTitle}>
                  {STAT_ICONS[region.stat]} {region.label}
                </Text>
                <Text style={styles.regionDetailDesc}>{region.description}</Text>
                <Button
                  title="View Adventures"
                  variant="secondary"
                  onPress={() => router.push('/quests')}
                />
              </>
            );
          })()}
        </Card>
      )}

      <Card style={styles.chaptersList}>
        <Text style={styles.sectionTitle}>All Campaign Chapters</Text>
        {CAMPAIGN_CHAPTERS.map((chapter) => (
          <View key={chapter.id} style={styles.chapterRow}>
            <Text style={styles.chapterRowTitle}>{chapter.title}</Text>
            <Text style={styles.chapterRowMeta}>
              {chapter.durationWeeks} weeks · {chapter.rewardTitle}
            </Text>
          </View>
        ))}
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backText: { color: colors.textAccent, fontSize: fontSize.xs },
  chapterCard: { marginBottom: spacing.lg },
  chapterOverline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  chapterTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '800',
    ...typography.heading,
  },
  chapterSubtitle: {
    color: colors.gold,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  chapterNarrative: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
    ...typography.journal,
  },
  chapterReward: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  chapterBtn: {},
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  regionCard: {
    width: '47%',
    minWidth: 140,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: colors.bgInset,
    alignItems: 'center',
  },
  regionCardSelected: {
    backgroundColor: colors.bgCardRaised,
  },
  regionIcon: { fontSize: 28, marginBottom: spacing.xs },
  regionLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  regionLevel: {
    fontSize: fontSize.md,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  dungeonNode: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
  },
  dungeonText: { fontSize: fontSize.xs, color: colors.warning },
  regionDetail: { marginBottom: spacing.lg },
  regionDetailTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  regionDetailDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  chaptersList: { marginBottom: spacing.xl },
  chapterRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  chapterRowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  chapterRowMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
