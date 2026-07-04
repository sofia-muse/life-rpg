import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useHeroStore } from '../../src/store/heroStore';
import { useQuestStore } from '../../src/store/questStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useUIStore } from '../../src/store/uiStore';
import { Card } from '../../src/components/layout/Card';
import { Badge } from '../../src/components/layout/Badge';
import { StatBar } from '../../src/components/game/StatBar';
import { StreakBanner } from '../../src/components/game/StreakBanner';
import { NiceAvatarCharacter } from '../../src/components/avatar/NiceAvatarCharacter';
import { XPPopup } from '../../src/components/game/XPPopup';
import { FadeIn } from '../../src/components/animated/FadeIn';
import { HeroShareCard } from '../../src/components/game/HeroShareCard';
import { DailyRewardModal } from '../../src/components/game/DailyRewardModal';
import { colors, spacing, fontSize, typography } from '../../src/config/theme';
import { STAT_NAMES, STAT_COLORS, StatName } from '../../src/types';
import { getStatDisplayProgress } from '../../src/engine/xpEngine';
import { HeroCrest } from '../../src/components/avatar/HeroCrest';
import { PulseGlow } from '../../src/components/animated/PulseGlow';
import {
  getContentMaxWidth,
  getScreenHorizontalPadding,
  getScreenTopPadding,
  getViewportSize,
} from '../../src/config/responsive';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hero = useHeroStore((s) => s.hero);
  const getDailyRewardPreview = useHeroStore((s) => s.getDailyRewardPreview);
  const claimDailyReward = useHeroStore((s) => s.claimDailyReward);
  const getActiveQuests = useQuestStore((s) => s.getActiveQuests);
  const getUnlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds);
  const showXPPopup = useUIStore((s) => s.showXPPopup);
  const xpPopupData = useUIStore((s) => s.xpPopupData);
  const dismissXP = useUIStore((s) => s.dismissXP);
  const characterEvent = useUIStore((s) => s.characterEvent);

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

  if (!hero) {
    return <View style={styles.center} />;
  }

  const activeQuests = getActiveQuests();
  const unlockedSkillCount = getUnlockedSkillIds().length;
  const todayQuests = activeQuests.filter((q) => q.type === 'daily');
  const viewport = getViewportSize(width);
  const useTwoColumns = width >= 980;
  const stackHero = width < 820;
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
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(124,92,252,0.08)', 'rgba(196,169,98,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View pointerEvents="none" style={styles.heroPanelOrb} />

              <View style={styles.panelTopRow}>
                <View style={styles.panelTopCopy}>
                  <Text style={styles.panelOverline}>Sanctuary Profile</Text>
                  <Text style={styles.panelTitle}>Your Living Legend</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/modal')} style={styles.settingsBtn}>
                  <Text style={styles.settingsIcon}>&#9881;</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.header, stackHero && styles.headerStacked]}>
                <PulseGlow
                  color={STAT_COLORS[hero.dominantStat]}
                  intensity="strong"
                  style={styles.headerAvatarGlow}
                >
                  <TouchableOpacity onPress={() => router.push('/customize')} activeOpacity={0.86}>
                    <NiceAvatarCharacter
                      appearance={hero.characterAppearance}
                      dominantStat={hero.dominantStat}
                      classTier={hero.classTier}
                      size={86}
                      event={characterEvent}
                    />
                  </TouchableOpacity>
                </PulseGlow>

                <View style={[styles.headerInfo, stackHero && styles.headerInfoStacked]}>
                  <Text style={styles.heroName}>{hero.name}</Text>
                  <Badge
                    label={`${hero.className} • Tier ${hero.classTier}`}
                    color={STAT_COLORS[hero.dominantStat]}
                  />
                  <Text style={styles.heroBlessing}>{homeBlessing}</Text>
                  <Text style={styles.heroLevel}>Hero Level {hero.heroLevel}</Text>
                  <View style={styles.heroActions}>
                    <TouchableOpacity
                      onPress={() => router.push('/customize')}
                      style={styles.primaryAction}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryActionText}>Enter Atelier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/modal')}
                      style={styles.secondaryAction}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.secondaryActionText}>Settings</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.crestWrap, stackHero && styles.crestWrapStacked]}>
                  <HeroCrest
                    hero={hero}
                    size={viewport === 'phone' ? 92 : 104}
                    onPress={() => router.push('/customize')}
                    variant="heroic"
                  />
                </View>
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
                <StreakBanner streakDays={hero.currentStreak} />
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
                        <View style={styles.questRow}>
                          <View style={[styles.questDot, { backgroundColor: STAT_COLORS[quest.stat] }]} />
                          <Text style={styles.questTitle} numberOfLines={useTwoColumns ? 2 : 1}>
                            {quest.title}
                          </Text>
                          <Text style={[styles.questXP, { color: STAT_COLORS[quest.stat] }]}>
                            +{quest.xpReward}
                          </Text>
                        </View>
                      </FadeIn>
                    ))
                  )}
                </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroPanel: {
    position: 'relative',
    backgroundColor: colors.bgCard,
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
    width: 112,
    height: 112,
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
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  heroBlessing: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.sm,
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
    backgroundColor: 'rgba(15, 15, 26, 0.6)',
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
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
