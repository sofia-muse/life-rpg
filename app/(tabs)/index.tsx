import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { STAT_NAMES, STAT_COLORS } from '../../src/types';
import { getStatDisplayProgress } from '../../src/engine/xpEngine';

export default function DashboardScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const addXP = useHeroStore((s) => s.addXP);
  const claimDailyReward = useHeroStore((s) => s.claimDailyReward);
  const getActiveQuests = useQuestStore((s) => s.getActiveQuests);
  const getUnlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds);
  const showXPPopup = useUIStore((s) => s.showXPPopup);
  const xpPopupData = useUIStore((s) => s.xpPopupData);
  const dismissXP = useUIStore((s) => s.dismissXP);
  const characterEvent = useUIStore((s) => s.characterEvent);

  const [dailyReward, setDailyReward] = useState<{
    xp: number;
    stat: any;
    bonusType: string;
  } | null>(null);

  useEffect(() => {
    if (hero) {
      const unlockedSkillIds = getUnlockedSkillIds();
      const reward = claimDailyReward({
        hasRegenerationSkill: unlockedSkillIds.includes('vit-2'),
        hasUnbreakableSkill: unlockedSkillIds.includes('wil-2'),
      });
      if (reward) {
        setTimeout(() => setDailyReward(reward), 800);
      }
    }
  }, [hero?.id, claimDailyReward, getUnlockedSkillIds]);

  const handleClaimReward = () => {
    if (dailyReward) {
      addXP(dailyReward.stat, dailyReward.xp);
    }
    setDailyReward(null);
  };

  if (!hero) {
    return <View style={styles.center} />;
  }

  const activeQuests = getActiveQuests();
  const todayQuests = activeQuests.filter((q) => q.type === 'daily');
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

      <View style={styles.container}>
        {/* Hero Header */}
        <FadeIn delay={0} slideFrom="none" duration={600}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/customize')} activeOpacity={0.8}>
              <NiceAvatarCharacter
                appearance={hero.characterAppearance}
                dominantStat={hero.dominantStat}
                classTier={hero.classTier}
                size={60}
                event={characterEvent}
              />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.heroName}>{hero.name}</Text>
              <Badge label={hero.className} color={STAT_COLORS[hero.dominantStat]} />
              <Text style={styles.heroBlessing}>{homeBlessing}</Text>
              <Text style={styles.heroLevel}>Hero Level {hero.heroLevel}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/modal')} style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>&#9881;</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Streak */}
        <FadeIn delay={100} slideFrom="bottom">
          <StreakBanner streakDays={hero.currentStreak} />
        </FadeIn>

        {/* Stat Bars */}
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

        {/* Today's Quests Summary */}
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
                    <Text style={styles.questTitle} numberOfLines={1}>
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

        {/* Quick Stats */}
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
          </View>
        </FadeIn>

        {/* Hero Share Card */}
        <FadeIn delay={800} slideFrom="bottom">
          <HeroShareCard hero={hero} />
        </FadeIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 48 },
  center: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  headerInfo: { marginLeft: spacing.md, flex: 1 },
  heroName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
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
  settingsBtn: { padding: spacing.xs },
  settingsIcon: { color: colors.textMuted, fontSize: 22 },
  statsCard: { marginBottom: spacing.md },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  questSummary: { marginBottom: spacing.md },
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
  quickStats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  quickStatCard: { flex: 1, alignItems: 'center' },
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
