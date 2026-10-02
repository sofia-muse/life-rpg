import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useHeroStore } from '../../src/store/heroStore';
import { useQuestStore } from '../../src/store/questStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useUIStore } from '../../src/store/uiStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { Card } from '../../src/components/layout/Card';
import { StatBar } from '../../src/components/game/StatBar';
import { StreakBanner } from '../../src/components/game/StreakBanner';
import { FadeIn } from '../../src/components/animated/FadeIn';
import { TavernRoom } from '../../src/components/game/TavernRoom';
import { HeroShareCard } from '../../src/components/game/HeroShareCard';
import { DailyRewardModal } from '../../src/components/game/DailyRewardModal';
import { WeeklyCampaignPanel } from '../../src/components/game/WeeklyCampaignPanel';
import { MentorQuote } from '../../src/components/game/MentorQuote';
import { BuildSummaryCard } from '../../src/components/game/BuildSummaryCard';
import { HallOfChampions } from '../../src/components/game/HallOfChampions';
import { colors, spacing, fontSize, typography } from '../../src/config/theme';
import { STAT_NAMES, STAT_COLORS, StatName } from '../../src/types';
import { getStatDisplayProgress } from '../../src/engine/xpEngine';
import { getPrimaryContract } from '../../src/config/classContracts';
import { buildWeeklyCupSummary, getActiveWeeklyPath } from '../../src/config/weeklyPaths';
import { getWeeklyCapacityBonus } from '../../src/engine/skillEngine';
import { buildWeeklyChallengePayload } from '../../src/config/weeklyCompetition';
import { buildHallOfFameEntry, useHallOfFameStore } from '../../src/store/hallOfFameStore';
import { useForgedSkillStore } from '../../src/store/forgedSkillStore';
import { useGameplayStore } from '../../src/store/gameplayStore';
import { getTimeOfDayGreeting } from '../../src/utils/gameFeedback';
import { presentQuestCompletionFeedback } from '../../src/utils/questCompletionFeedback';
import {
  getContentMaxWidth,
  getScreenHorizontalPadding,
  getScreenTopPadding,
} from '../../src/config/responsive';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const hero = useHeroStore((s) => s.hero);
  const getDailyRewardPreview = useHeroStore((s) => s.getDailyRewardPreview);
  const claimDailyReward = useHeroStore((s) => s.claimDailyReward);
  const getActiveQuests = useQuestStore((s) => s.getActiveQuests);
  const getQuestById = useQuestStore((s) => s.getQuestById);
  const getUnlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds);
  const completeQuestFlow = useGameplayStore((s) => s.completeQuest);
  const characterEvent = useUIStore((s) => s.characterEvent);
  const settings = useSettingsStore();
  const { quests } = useQuestStore();
  const hallEntries = useHallOfFameStore((s) => s.entries);
  const addHallEntry = useHallOfFameStore((s) => s.addEntry);
  const forged = useForgedSkillStore((s) => s.forged);
  const { greeting, period } = getTimeOfDayGreeting();

  useEffect(() => {
    settings.clearStaleWeeklyPath();
  }, [settings.clearStaleWeeklyPath]);

  const handleClaimWeeklyReward = (reward: { title: string; badge: string }) => {
    if (!hero) return;
    settings.claimWeeklyReward(reward);
    settings.incrementWeeklyContractsCompleted();
    const contract = getPrimaryContract(
      hero,
      settings,
      quests,
      getWeeklyCapacityBonus(getUnlockedSkillIds()),
    );
    const payload = buildWeeklyChallengePayload(hero, settings, contract, quests);
    if (payload && settings.weeklyPathWeekKey) {
      addHallEntry(
        buildHallOfFameEntry(
          settings.weeklyPathWeekKey,
          payload.heroName,
          payload.className,
          payload.pathLabel,
          payload.cupScore,
          payload.cupRank,
          payload.contractTitle,
        ),
      );
    }
    useUIStore.getState().setCharacterEvent('contractComplete');
    setTimeout(() => useUIStore.getState().setCharacterEvent('idle'), 2000);
  };

  const [dailyReward, setDailyReward] = useState<{
    xp: number;
    stat: StatName;
    bonusType: string;
  } | null>(null);

  useEffect(() => {
    if (hero) {
      const reward = getDailyRewardPreview();
      if (reward) {
        setTimeout(() => setDailyReward(reward), 800);
      }
    }
  }, [hero?.id, hero?.lastRewardDate, getDailyRewardPreview]);

  const handleClaimReward = () => {
    if (dailyReward) claimDailyReward(getUnlockedSkillIds());
    setDailyReward(null);
  };

  const handleCompleteTodayQuest = (questId: string) => {
    void (async () => {
      try {
        const priorQuest = getQuestById(questId);
        const result = await completeQuestFlow(questId);
        if (!result) return;
        presentQuestCompletionFeedback(priorQuest, result);
      } catch (error) {
        console.error('[Home] Failed to complete quest.', { questId, error });
      }
    })();
  };

  if (!hero) {
    return <View style={styles.center} />;
  }

  const activeQuests = getActiveQuests();
  const unlockedSkillCount = getUnlockedSkillIds().length;
  const unlockedSkillIds = getUnlockedSkillIds();
  const weeklyCapacityBonus = getWeeklyCapacityBonus(unlockedSkillIds);
  const todayQuests = activeQuests.filter((q) => q.type === 'daily');
  const contract = getPrimaryContract(hero, settings, quests, weeklyCapacityBonus);
  const cup = getActiveWeeklyPath(settings)
    ? buildWeeklyCupSummary(
        settings,
        quests,
        hero.currentStreak,
        contract.completedMatches,
        contract.requiredCount,
      )
    : null;
  const useTwoColumns = width >= 980;
  const compactRoom = width < 820;
  const shellPadding = getScreenHorizontalPadding(width);
  const topPadding = getScreenTopPadding(width, Platform.OS === 'web');
  const pageMaxWidth = getContentMaxWidth(width, 'wide');
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {dailyReward && (
        <DailyRewardModal
          visible={!!dailyReward}
          xp={dailyReward.xp}
          stat={dailyReward.stat}
          bonusType={dailyReward.bonusType}
          loginDays={hero.totalLoginDays || 1}
          onClaim={handleClaimReward}
        />
      )}

      <View
        style={[
          styles.container,
          {
            paddingHorizontal: shellPadding,
            paddingTop: topPadding,
          },
        ]}
      >
        <View style={[styles.pageShell, pageMaxWidth ? { maxWidth: pageMaxWidth } : null]}>
          <FadeIn delay={0} slideFrom="none" duration={650} scaleFrom={0.98}>
            <TavernRoom
              hero={hero}
              greeting={greeting}
              period={period}
              characterEvent={characterEvent}
              compact={compactRoom}
            />
          </FadeIn>

          <FadeIn delay={80} slideFrom="bottom">
            <WeeklyCampaignPanel
              hero={hero}
              settings={settings}
              quests={quests}
              onChoosePath={settings.chooseWeeklyPath}
              onClaimReward={handleClaimWeeklyReward}
            />
          </FadeIn>

          <FadeIn delay={90} slideFrom="bottom">
            <MentorQuote dominantStat={hero.dominantStat} />
          </FadeIn>

          <View style={[styles.contentGrid, useTwoColumns && styles.contentGridWide]}>
            <View style={[styles.mainColumn, useTwoColumns && styles.mainColumnWide]}>
              <FadeIn delay={100} slideFrom="bottom">
                <StreakBanner streakDays={hero.currentStreak} />
              </FadeIn>

              <FadeIn delay={150} slideFrom="bottom">
                <BuildSummaryCard
                  hero={hero}
                  settings={settings}
                  unlockedSkillIds={unlockedSkillIds}
                  forgedSkillCount={forged.length}
                  sampleQuest={todayQuests[0]}
                />
              </FadeIn>

              <FadeIn delay={200} slideFrom="bottom">
                <Card style={styles.statsCard}>
                  <Text style={styles.sectionTitle}>Heroic Attributes</Text>
                  {STAT_NAMES.map((stat, i) => {
                    const display = getStatDisplayProgress(hero.statXP[stat]);
                    return (
                      <FadeIn key={stat} delay={300 + i * 80} slideFrom="left" slideDistance={15}>
                        <StatBar
                          stat={stat}
                          level={display.level}
                          currentXP={display.currentXP}
                          xpNeeded={display.xpNeeded}
                          progress={display.progress}
                        />
                      </FadeIn>
                    );
                  })}
                </Card>
              </FadeIn>
            </View>

            <View style={[styles.sideColumn, useTwoColumns && styles.sideColumnWide]}>
              <FadeIn delay={500} slideFrom="bottom">
                <Card style={styles.questSummary}>
                  <Text style={styles.sectionTitle}>Today&apos;s Quests</Text>
                  {todayQuests.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No active quests yet. Visit Quests and choose one small act to begin the day.
                    </Text>
                  ) : (
                    todayQuests.map((quest, i) => (
                      <FadeIn key={quest.id} delay={600 + i * 60} slideFrom="right" slideDistance={12}>
                        <TouchableOpacity
                          style={styles.questRow}
                          onPress={() => handleCompleteTodayQuest(quest.id)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.questDot, { backgroundColor: STAT_COLORS[quest.stat] }]} />
                          <Text style={styles.questTitle} numberOfLines={useTwoColumns ? 2 : 1}>
                            {quest.title}
                          </Text>
                          <Text style={[styles.questXP, { color: STAT_COLORS[quest.stat] }]}>
                            +{quest.xpReward}
                          </Text>
                        </TouchableOpacity>
                      </FadeIn>
                    ))
                  )}
                </Card>
              </FadeIn>

              <FadeIn delay={650} slideFrom="bottom">
                <HallOfChampions
                  entries={hallEntries}
                  currentScore={cup?.score}
                  currentRank={cup?.rank}
                />
              </FadeIn>

              <FadeIn delay={700} slideFrom="bottom">
                <View style={styles.quickStats}>
                  <Card style={styles.quickStatCard}>
                    <Text style={styles.quickStatNum}>{hero.totalQuestsCompleted}</Text>
                    <Text style={styles.quickStatLabel}>Quests Honored</Text>
                  </Card>
                  <Card style={styles.quickStatCard}>
                    <Text style={styles.quickStatNum}>{hero.longestStreak}</Text>
                    <Text style={styles.quickStatLabel}>Steady Days</Text>
                  </Card>
                  <Card style={styles.quickStatCard}>
                    <Text style={styles.quickStatNum}>{unlockedSkillCount}</Text>
                    <Text style={styles.quickStatLabel}>Awakened Skills</Text>
                  </Card>
                </View>
              </FadeIn>
            </View>
          </View>

          <FadeIn delay={800} slideFrom="bottom">
            <HeroShareCard hero={hero} />
          </FadeIn>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1 },
  pageShell: {
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentGrid: {
    gap: spacing.md,
  },
  contentGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainColumn: {
    gap: spacing.md,
  },
  mainColumnWide: {
    flex: 1.4,
    minWidth: 0,
  },
  sideColumn: {
    gap: spacing.md,
  },
  sideColumnWide: {
    flex: 0.9,
    minWidth: 320,
    maxWidth: 420,
  },
  statsCard: {},
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  questSummary: {},
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 18,
    ...typography.journal,
  },
  questRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  questDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  questTitle: { flex: 1, color: colors.textPrimary, fontSize: fontSize.md, ...typography.body },
  questXP: { fontSize: fontSize.sm, fontWeight: '700', ...typography.headingWide },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    minWidth: 110,
    alignItems: 'center',
  },
  quickStatNum: {
    color: colors.textAccent,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    ...typography.heading,
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
});
