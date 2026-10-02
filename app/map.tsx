import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Button } from '../src/components/layout/Button';
import { WorldMap } from '../src/components/game/WorldMap';
import { useHeroStore } from '../src/store/heroStore';
import { useQuestStore } from '../src/store/questStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useUIStore } from '../src/store/uiStore';
import {
  CAMPAIGN_CHAPTERS,
  STAT_REGIONS,
  getChapterForHero,
  isChapterLocked,
} from '../src/config/campaignChapters';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP, StatName } from '../src/types';
import { playGameFeedback } from '../src/utils/gameFeedback';

export default function MapScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const { quests, addQuest } = useQuestStore();
  const [selectedRegion, setSelectedRegion] = useState<StatName | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const flash = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  if (!hero) return null;

  const activeChapter = getChapterForHero(hero.dominantStat);
  const bossQuests = quests.filter((q) => q.type === 'boss' && !q.isCompleted);
  const bossCounts = STAT_REGIONS.reduce<Partial<Record<StatName, number>>>((counts, region) => {
    counts[region.stat] = bossQuests.filter((quest) => quest.stat === region.stat).length;
    return counts;
  }, {});

  const shakeChapter = (chapterId: string) => {
    setShakingId(chapterId);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start(() => setShakingId(null));
    void playGameFeedback('click', hapticEnabled);
  };

  const handleStartChapter = () => {
    if (isChapterLocked(activeChapter, hero.heroLevel, hero.dominantStat)) {
      shakeChapter(activeChapter.id);
      useUIStore.getState().pushToast(`Requires hero level ${activeChapter.minHeroLevel}`);
      return;
    }

    void playGameFeedback('bossPhase', hapticEnabled);
    flash.setValue(0.85);
    Animated.timing(flash, { toValue: 0, duration: 620, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      addQuest({
        title: activeChapter.bossTemplateTitle,
        description: activeChapter.narrative,
        type: 'boss',
        difficulty: 'hard',
        stat: activeChapter.dominantStats[0],
        xpReward: DIFFICULTY_XP.hard,
        isActive: true,
        totalSteps: 30,
        completedSteps: 0,
        campaignChapterId: activeChapter.id,
      });
      router.push('/quests');
    });
  };

  const selected = STAT_REGIONS.find((region) => region.stat === selectedRegion);
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });

  return (
    <ScreenWrapper contentWidth="wide">
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
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
      <WorldMap
        dominantStat={hero.dominantStat}
        stats={hero.stats}
        bossCounts={bossCounts}
        selected={selectedRegion}
        onSelect={setSelectedRegion}
        onArrived={(stat) => {
          void playGameFeedback('click', hapticEnabled);
          router.push({ pathname: '/quests', params: { region: stat } });
        }}
      />

      {selected ? (
        <Card style={styles.regionDetail}>
          <Text style={styles.regionDetailTitle}>
            {STAT_ICONS[selected.stat]} {selected.label}
          </Text>
          <Text style={styles.regionDetailDesc}>{selected.description}</Text>
          <Text style={[styles.regionLevel, { color: STAT_COLORS[selected.stat] }]}>
            Region level {hero.stats[selected.stat]}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.chaptersList}>
        <Text style={styles.sectionTitle}>All Campaign Chapters</Text>
        {CAMPAIGN_CHAPTERS.map((chapter) => {
          const locked = isChapterLocked(chapter, hero.heroLevel, hero.dominantStat);
          const row = (
            <View style={[styles.chapterRow, locked && styles.chapterLocked]}>
              <Text style={styles.chapterRowTitle}>
                {locked ? '🔒 ' : ''}
                {chapter.title}
              </Text>
              <Text style={styles.chapterRowMeta}>
                {locked
                  ? `Shrouded until hero level ${chapter.minHeroLevel}`
                  : `${chapter.durationWeeks} weeks · ${chapter.rewardTitle}`}
              </Text>
            </View>
          );
          if (!locked) return <View key={chapter.id}>{row}</View>;
          return (
            <Animated.View
              key={chapter.id}
              style={shakingId === chapter.id ? { transform: [{ translateX: shakeX }] } : undefined}
            >
              <TouchableOpacity onPress={() => {
                shakeChapter(chapter.id);
                useUIStore.getState().pushToast(`Requires hero level ${chapter.minHeroLevel}`);
              }}>
                {row}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.goldBright,
    zIndex: 20,
  },
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
    marginBottom: spacing.sm,
  },
  regionLevel: {
    fontSize: fontSize.md,
    fontWeight: '900',
  },
  chaptersList: { marginBottom: spacing.xl },
  chapterRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  chapterLocked: {
    opacity: 0.55,
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
