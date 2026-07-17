import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Badge } from '../src/components/layout/Badge';
import { Button } from '../src/components/layout/Button';
import { useHeroStore } from '../src/store/heroStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useQuestStore } from '../src/store/questStore';
import { useSkillStore } from '../src/store/skillStore';
import { getWeeklyPathDefinition } from '../src/config/weeklyPaths';
import { getClassDefinition } from '../src/config/classes';
import { SKILLS } from '../src/config/skills';
import { STREAK_MILESTONES } from '../src/engine/streakEngine';
import { getBossSagaState } from '../src/engine/questProgression';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import { STAT_ICONS, STAT_NAMES, ClassTier } from '../src/types';

export default function CodexScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const weeklyPath = useSettingsStore((s) => s.weeklyPath);
  const weeklyRewardTitle = useSettingsStore((s) => s.weeklyRewardTitle);
  const { quests } = useQuestStore();
  const { isSkillUnlocked } = useSkillStore();

  const activePathDefinition = weeklyPath ? getWeeklyPathDefinition(weeklyPath) : null;
  const classLineage = hero
    ? ([1, 2, 3, 4, 5] as ClassTier[]).map((tier) => getClassDefinition(hero.dominantStat, tier))
    : [];
  const unlockedSkills = SKILLS.filter((s) => isSkillUnlocked(s.id));
  const completedBosses = quests.filter((q) => q.type === 'boss' && q.isCompleted);
  const streakMilestones = hero
    ? STREAK_MILESTONES.filter((m) => hero.longestStreak >= m.days)
    : [];

  return (
    <ScreenWrapper contentWidth="regular">
      <ScreenHeader
        eyebrow="Field Guide"
        title="The Codex"
        subtitle="A quiet guide to how your journey grows, rewards you, and stays easy to read."
        action={
          <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
            <Text style={styles.headerActionText}>Return</Text>
          </TouchableOpacity>
        }
      />

      <Card tone="accent">
        <View style={styles.heroSummary}>
          <View style={styles.heroSummaryCopy}>
            <Text style={styles.heroSummaryTitle}>
              {hero ? `${hero.name}'s Guide` : 'A Gentle Primer'}
            </Text>
            <Text style={styles.heroSummaryText}>
              Life RPG turns small real-world actions into a living fantasy record. Choose a few
              quests, keep your streak alive, and let your strongest habits shape your class.
            </Text>
          </View>
          <View style={styles.badgeWrap}>
            {hero ? <Badge label={hero.className} /> : <Badge label="New Adventurer" />}
            {activePathDefinition ? (
              <Badge
                label={activePathDefinition.label}
                color={colors.moon}
                style={styles.badgeSpacing}
              />
            ) : null}
            {weeklyRewardTitle ? (
              <Badge label={weeklyRewardTitle} color={colors.success} style={styles.badgeSpacing} />
            ) : null}
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>How Growth Works</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>
            1. Complete quests to earn XP in one of the six hero stats.
          </Text>
          <Text style={styles.infoItem}>
            2. Stat levels raise your overall hero level and unlock new class tiers over time.
          </Text>
          <Text style={styles.infoItem}>
            3. Repeated actions unlock passive skills, so your real routines become your build.
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>The Six Attributes</Text>
        <View style={styles.statsGrid}>
          {STAT_NAMES.map((stat) => (
            <View key={stat} style={styles.statChip}>
              <Text style={styles.statIcon}>{STAT_ICONS[stat]}</Text>
              <Text style={styles.statLabel}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Quest Types</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>
            Daily quests are your smallest rituals. Keep them gentle and repeatable.
          </Text>
          <Text style={styles.infoItem}>
            Side quests are one-time pushes when you want a clear win or a fresh challenge.
          </Text>
          <Text style={styles.infoItem}>
            Boss quests are longer arcs that reward consistency across several steps.
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Paths, Streaks, and Blessings</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>
            Each week you can choose a path that lightly shapes your contract and aligned XP bonus.
          </Text>
          <Text style={styles.infoItem}>
            Daily rewards and streak bonuses are there to help momentum feel warm, not punishing.
          </Text>
          <Text style={styles.infoItem}>
            If the app ever feels too loud, return to smaller quests and let the sanctuary page guide
            the next step.
          </Text>
        </View>
        {activePathDefinition ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Current Path</Text>
            <Text style={styles.calloutText}>
              {activePathDefinition.label}: {activePathDefinition.focus}
            </Text>
          </View>
        ) : null}
      </Card>

      {hero && classLineage.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Class Lineage — {hero.dominantStat}</Text>
          {classLineage.map((tier) => (
            <View
              key={tier.tier}
              style={[
                styles.lineageRow,
                hero.classTier >= tier.tier && styles.lineageUnlocked,
              ]}
            >
              <Text style={styles.lineageTier}>Tier {tier.tier}</Text>
              <Text style={styles.lineageName}>{tier.name}</Text>
              <Text style={styles.lineageDesc} numberOfLines={1}>
                {tier.description}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {unlockedSkills.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Discovered Abilities</Text>
          {unlockedSkills.slice(0, 8).map((skill) => (
            <View key={skill.id} style={styles.skillRow}>
              <Text style={styles.skillIcon}>{skill.icon}</Text>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillEffect} numberOfLines={1}>
                  {skill.effect}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {completedBosses.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Completed Boss Arcs</Text>
          {completedBosses.map((boss) => {
            const saga = getBossSagaState(boss);
            return (
              <View key={boss.id} style={styles.bossRow}>
                <Text style={styles.bossTitle}>{saga?.sagaTitle ?? boss.title}</Text>
                <Text style={styles.bossReward}>Relic: {saga?.rewardTitle ?? 'Campaign Relic'}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {streakMilestones.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Streak Hall of Fame</Text>
          <View style={styles.streakRow}>
            {streakMilestones.map((m) => (
              <View key={m.days} style={styles.streakChip}>
                <Text style={styles.streakDays}>{m.days}d</Text>
                <Text style={styles.streakTitle}>{m.title}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.actionRow}>
        <Button title="Adventures" onPress={() => router.push('/quests')} style={styles.actionBtn} />
        <Button title="World Map" onPress={() => router.push('/map' as Href)} variant="secondary" style={styles.actionBtn} />
        <Button title="Trophy Hall" onPress={() => router.push('/achievements' as Href)} style={styles.actionBtn} />
        <Button
          title="Sanctuary"
          onPress={() => router.push('/')}
          variant="secondary"
          style={styles.actionBtn}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlassStrong,
  },
  headerActionText: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    ...typography.overline,
  },
  heroSummary: {
    gap: spacing.md,
  },
  heroSummaryCopy: {
    gap: spacing.sm,
  },
  heroSummaryTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    ...typography.heading,
  },
  heroSummaryText: {
    color: colors.textSoft,
    fontSize: fontSize.md,
    lineHeight: 22,
    ...typography.body,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeSpacing: {
    marginRight: spacing.xs,
  },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
    ...typography.headingWide,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 21,
    ...typography.body,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statChip: {
    minWidth: 132,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlass,
  },
  statIcon: {
    fontSize: 18,
  },
  statLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    ...typography.bodyStrong,
  },
  callout: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlassStrong,
  },
  calloutTitle: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
    ...typography.overline,
  },
  calloutText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    ...typography.bodyStrong,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    minWidth: 140,
  },
  lineageRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    opacity: 0.45,
  },
  lineageUnlocked: { opacity: 1 },
  lineageTier: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  lineageName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  lineageDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skillIcon: { fontSize: 20 },
  skillInfo: { flex: 1 },
  skillName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  skillEffect: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  bossRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bossTitle: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  bossReward: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  streakRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  streakChip: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgGlass,
    alignItems: 'center',
    minWidth: 72,
  },
  streakDays: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  streakTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
});
