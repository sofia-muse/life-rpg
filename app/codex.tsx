import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Badge } from '../src/components/layout/Badge';
import { Button } from '../src/components/layout/Button';
import { useHeroStore } from '../src/store/heroStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { getWeeklyPathDefinition } from '../src/config/weeklyPaths';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import { STAT_ICONS, STAT_NAMES } from '../src/types';

export default function CodexScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const weeklyPath = useSettingsStore((s) => s.weeklyPath);
  const weeklyRewardTitle = useSettingsStore((s) => s.weeklyRewardTitle);

  const activePathDefinition = weeklyPath ? getWeeklyPathDefinition(weeklyPath) : null;

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

      <View style={styles.actionRow}>
        <Button title="Open Quests" onPress={() => router.push('/quests')} style={styles.actionBtn} />
        <Button
          title="Visit Sanctuary"
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
    minWidth: 160,
  },
});
