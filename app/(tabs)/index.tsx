import { RPGIcon } from '../../src/components/game/RPGIcon';
import { useCompletionStore } from '../../src/store/completionStore';
import { FantasyIcon } from '../../src/components/game/FantasyIcon';
import { ForestScene } from '../../src/components/layout/StoryHeader';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useHeroStore } from '../../src/store/heroStore';
import { useQuestStore } from '../../src/store/questStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useUIStore } from '../../src/store/uiStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { Card } from '../../src/components/layout/Card';
import { Badge } from '../../src/components/layout/Badge';
import { StatBar } from '../../src/components/game/StatBar';
import { StreakBanner } from '../../src/components/game/StreakBanner';
import { NiceAvatarCharacter } from '../../src/components/avatar/NiceAvatarCharacter';
import { XPPopup } from '../../src/components/game/XPPopup';
import { FadeIn } from '../../src/components/animated/FadeIn';
import { HeroShareCard } from '../../src/components/game/HeroShareCard';
import { DailyRewardModal } from '../../src/components/game/DailyRewardModal';
import { WeeklyCampaignPanel } from '../../src/components/game/WeeklyCampaignPanel';
import { MentorQuote } from '../../src/components/game/MentorQuote';
import { BuildSummaryCard } from '../../src/components/game/BuildSummaryCard';
import { HallOfChampions } from '../../src/components/game/HallOfChampions';
import { colors, spacing, fontSize, typography } from '../../src/config/theme';
import { STAT_NAMES, StatName } from '../../src/types';
import { getStatDisplayProgress } from '../../src/engine/xpEngine';
import { getPrimaryContract } from '../../src/config/classContracts';
import { buildWeeklyCupSummary, getActiveWeeklyPath } from '../../src/config/weeklyPaths';
import { getWeeklyCapacityBonus } from '../../src/engine/skillEngine';
import { buildWeeklyChallengePayload } from '../../src/config/weeklyCompetition';
import { buildHallOfFameEntry, useHallOfFameStore } from '../../src/store/hallOfFameStore';
import { EQUIPPABLE_TITLES } from '../../src/config/achievements';
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hero = useHeroStore((s) => s.hero);
  const getDailyRewardPreview = useHeroStore((s) => s.getDailyRewardPreview);
  const claimDailyReward = useGameplayStore((s) => s.claimDailyLogin);
  const getActiveQuests = useQuestStore((s) => s.getActiveQuests);
  const getQuestById = useQuestStore((s) => s.getQuestById);
  const getUnlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds);
  const completeQuestFlow = useGameplayStore((s) => s.completeQuest);
  const showXPPopup = useUIStore((s) => s.showXPPopup);
  const xpPopupData = useUIStore((s) => s.xpPopupData);
  const dismissXP = useUIStore((s) => s.dismissXP);
  const characterEvent = useUIStore((s) => s.characterEvent);
  const completions = useCompletionStore((s) => s.events);
  const settings = useSettingsStore();
  const { quests } = useQuestStore();
  const hallEntries = useHallOfFameStore((s) => s.entries);
  const addHallEntry = useHallOfFameStore((s) => s.addEntry);
  const forged = useForgedSkillStore((s) => s.forged);
  const { greeting } = getTimeOfDayGreeting();
  const equippedTitle =
    settings.customTitleLabels[settings.equippedTitleId] ??
    EQUIPPABLE_TITLES.find((t) => t.id === settings.equippedTitleId)?.label ??
    'Humble Adventurer';

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
      completions,
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

  const [showShareCard, setShowShareCard] = useState(false);
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

  const handleClaimReward = async () => {
    if (dailyReward) await claimDailyReward();
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
  const contract = getPrimaryContract(hero, settings, quests, weeklyCapacityBonus, completions);
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
  const stackHero = width < 360;
  const shellPadding = getScreenHorizontalPadding(width);
  const topPadding = getScreenTopPadding(width, Platform.OS === 'web');
  const pageMaxWidth = getContentMaxWidth(width, 'wide');
  const homeBlessing =
    todayQuests.length > 0
      ? `${todayQuests.length} small quest${todayQuests.length === 1 ? '' : 's'} await your light today.`
      : 'The sanctuary is quiet. Choose one gentle quest when you are ready.';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {showXPPopup && xpPopupData && (
        <XPPopup stat={xpPopupData.stat} amount={xpPopupData.amount} onDone={dismissXP} />
      )}

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
            <View style={styles.heroPanel}>
              <ForestScene />

              <View style={styles.panelTopRow}>
                <View style={styles.panelTopCopy}>
                  <Text style={styles.panelOverline}>Life RPG · The Enchanted Grove</Text>
                  <Text style={styles.panelTitle}>Your story awakens</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/modal')}
                  style={styles.settingsBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                >
                  <RPGIcon name="settings" size={32} />
                </TouchableOpacity>
              </View>

              <View style={[styles.header, stackHero && styles.headerStacked]}>
                <View style={[styles.headerAvatarGlow, width < 600 && { width: 116, height: 116 }]}>
                  <TouchableOpacity onPress={() => router.push('/customize')} activeOpacity={0.86}>
                    <NiceAvatarCharacter
                      appearance={hero.characterAppearance}
                      dominantStat={hero.dominantStat}
                      classTier={hero.classTier}
                      size={width < 600 ? 96 : 160}
                      event={characterEvent}
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.headerInfo, stackHero && styles.headerInfoStacked]}>
                  <Text style={styles.heroName}>{hero.name}</Text>
                  <Text style={styles.heroTitle}>{equippedTitle}</Text>
                  <Badge
                    label={`${hero.className} • Tier ${hero.classTier}`}
                    color={colors.goldLight}
                  />
                  <Text style={styles.heroBlessing}>{greeting}</Text>
                  <Text style={styles.heroSubBlessing}>{homeBlessing}</Text>
                  <Text style={styles.heroLevel}>Hero Level {hero.heroLevel}</Text>
                </View>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity
                  onPress={() => router.push('/map' as Href)}
                  style={styles.primaryAction}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionText}>World Map</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/customize')}
                  style={styles.secondaryAction}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryActionText}>Atelier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/achievements' as Href)}
                  style={styles.secondaryAction}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryActionText}>Trophies</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileMetrics}>
                <View style={styles.profileMetric}>
                  <Text style={styles.profileMetricValue}>{hero.totalQuestsCompleted}</Text>
                  <Text style={styles.profileMetricLabel}>Quests Honored</Text>
                </View>
                <View style={styles.profileMetricDivider} />
                <View style={styles.profileMetric}>
                  <Text style={styles.profileMetricValue}>{hero.currentStreak}</Text>
                  <Text style={styles.profileMetricLabel}>Sacred Streak</Text>
                </View>
                <View style={styles.profileMetricDivider} />
                <View style={styles.profileMetric}>
                  <Text style={styles.profileMetricValue}>{unlockedSkillCount}</Text>
                  <Text style={styles.profileMetricLabel}>Awakened Skills</Text>
                </View>
              </View>
            </View>
          </FadeIn>

          <View style={[styles.contentGrid, useTwoColumns && styles.contentGridWide]}>
            <View style={[styles.mainColumn, useTwoColumns && styles.mainColumnWide]}>
              <FadeIn delay={100} slideFrom="bottom">
                <Card style={styles.questSummary}>
                  <Text style={styles.sectionTitle}>Today&apos;s Quests</Text>
                  {todayQuests.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No active quests yet. Visit Quests and choose one small act to begin the day.
                    </Text>
                  ) : (
                    todayQuests.map((quest, i) => (
                      <FadeIn
                        key={quest.id}
                        delay={600 + i * 60}
                        slideFrom="right"
                        slideDistance={12}
                      >
                        <TouchableOpacity
                          style={styles.questRow}
                          onPress={() => handleCompleteTodayQuest(quest.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Complete ${quest.title}`}
                          activeOpacity={0.8}
                        >
                          <View style={{ marginRight: 12 }}>
                            <FantasyIcon stat={quest.stat} size={40} />
                          </View>
                          <Text style={styles.questTitle} numberOfLines={3}>
                            {quest.title}
                          </Text>
                          <Text style={[styles.questXP, { color: '#3E5845' }]}>
                            +{quest.xpReward}
                          </Text>
                        </TouchableOpacity>
                      </FadeIn>
                    ))
                  )}
                </Card>
              </FadeIn>

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

              <FadeIn delay={650} slideFrom="bottom">
                <HallOfChampions
                  entries={hallEntries}
                  currentScore={cup?.score}
                  currentRank={cup?.rank}
                />
              </FadeIn>
            </View>
          </View>

          <FadeIn delay={800} slideFrom="bottom">
            <TouchableOpacity
              onPress={() => setShowShareCard(!showShareCard)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showShareCard }}
              style={styles.shareToggle}
            >
              <Text style={styles.secondaryActionText}>
                {showShareCard ? 'Close hero card' : 'Share your story ↗'}
              </Text>
            </TouchableOpacity>
            {showShareCard && <HeroShareCard hero={hero} />}
          </FadeIn>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shareToggle: {
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1 },
  pageShell: {
    paddingBottom: 110,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroPanel: {
    minHeight: 360,
    position: 'relative',
    backgroundColor: colors.bgCanvas,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  heroPanelOrb: {
    position: 'absolute',
    top: -30,
    right: -22,
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.amethystGlow,
  },
  panelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  panelTopCopy: {
    flex: 1,
    minWidth: 0,
  },
  panelOverline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '800',
    ...typography.heading,
  },
  headerAvatarGlow: {
    width: 180,
    height: 180,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerInfoStacked: {
    width: '100%',
  },
  crestWrap: {
    alignItems: 'flex-end',
  },
  crestWrapStacked: {
    width: '100%',
    alignItems: 'flex-start',
  },
  heroName: {
    color: colors.textPrimary,
    fontSize: fontSize.hero,
    fontWeight: '900',
    marginBottom: 2,
    ...typography.heading,
  },
  heroTitle: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
    ...typography.journal,
  },
  heroBlessing: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.sm,
    ...typography.body,
    fontWeight: '600',
  },
  heroSubBlessing: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.xs,
    ...typography.journal,
  },
  heroLevel: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryActionText: {
    color: colors.bgPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  secondaryAction: {
    backgroundColor: 'rgba(7, 18, 15, 0.6)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    ...typography.headingWide,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(7, 18, 15, 0.55)',
  },
  settingsIcon: { color: colors.textMuted, fontSize: 20 },
  profileMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  profileMetric: {
    flex: 1,
    alignItems: 'center',
  },
  profileMetricDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  profileMetricValue: {
    color: colors.goldBright,
    fontSize: fontSize.xl,
    fontWeight: '900',
    ...typography.heading,
  },
  profileMetricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
    ...typography.headingWide,
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
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
    backgroundColor: '#EEE5CB',
    borderRadius: 10,
  },
  questDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  questTitle: { flex: 1, color: '#21382D', fontSize: fontSize.md, ...typography.body },
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
