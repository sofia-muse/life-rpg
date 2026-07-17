import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { useHeroStore } from '../src/store/heroStore';
import { useQuestStore } from '../src/store/questStore';
import { useSkillStore } from '../src/store/skillStore';
import { useForgedSkillStore } from '../src/store/forgedSkillStore';
import { useSettingsStore } from '../src/store/settingsStore';
import {
  ACHIEVEMENT_DEFINITIONS,
  EQUIPPABLE_TITLES,
  buildAchievementContext,
  getEarnedAchievements,
  getUnlockedTitleIds,
} from '../src/config/achievements';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: colors.gold,
  mythic: colors.amethyst,
};

export default function AchievementsScreen() {
  const router = useRouter();
  const hero = useHeroStore((s) => s.hero);
  const { quests } = useQuestStore();
  const unlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds());
  const forged = useForgedSkillStore((s) => s.forged);
  const settings = useSettingsStore();

  const ctx = useMemo(() => {
    if (!hero) return null;
    return buildAchievementContext(
      hero,
      quests,
      unlockedSkillIds.length,
      forged.length,
      settings,
      settings.weeklyContractsCompleted,
    );
  }, [hero, quests, unlockedSkillIds.length, forged.length, settings]);

  const earned = useMemo(
    () => (ctx ? getEarnedAchievements(ctx) : []),
    [ctx],
  );
  const earnedIds = new Set(earned.map((a) => a.id));
  const unlockedTitleIds = ctx ? getUnlockedTitleIds(ctx) : ['adventurer'];

  if (!hero || !ctx) return null;

  return (
    <ScreenWrapper contentWidth="regular">
      <ScreenHeader
        eyebrow="Hall of Deeds"
        title="Trophy Hall"
        subtitle={`${earned.length} of ${ACHIEVEMENT_DEFINITIONS.length} achievements earned`}
        action={
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Return</Text>
          </TouchableOpacity>
        }
      />

      <Card style={styles.titlesCard}>
        <Text style={styles.sectionTitle}>Equippable Titles</Text>
        <View style={styles.titleGrid}>
          {EQUIPPABLE_TITLES.map((title) => {
            const unlocked = unlockedTitleIds.includes(title.id);
            const equipped = settings.equippedTitleId === title.id;
            return (
              <TouchableOpacity
                key={title.id}
                style={[
                  styles.titleChip,
                  unlocked && styles.titleChipUnlocked,
                  equipped && styles.titleChipEquipped,
                ]}
                onPress={() => unlocked && settings.setEquippedTitle(title.id)}
                disabled={!unlocked}
              >
                <Text style={[styles.titleChipLabel, !unlocked && styles.titleChipLocked]}>
                  {title.label}
                </Text>
                <Text style={styles.titleChipCondition}>{title.condition}</Text>
                {equipped && <Text style={styles.equippedBadge}>Equipped</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Achievements</Text>
      {ACHIEVEMENT_DEFINITIONS.map((def) => {
        const isEarned = earnedIds.has(def.id);
        return (
          <Card
            key={def.id}
            style={[styles.achievementCard, !isEarned && styles.achievementLocked]}
          >
            <View style={styles.achievementRow}>
              <Text style={[styles.achievementIcon, !isEarned && styles.lockedIcon]}>
                {isEarned ? def.icon : '🔒'}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, !isEarned && styles.lockedText]}>
                  {def.title}
                </Text>
                <Text style={styles.achievementDesc}>{def.description}</Text>
              </View>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: `${TIER_COLORS[def.tier]}30` },
                ]}
              >
                <Text style={[styles.tierText, { color: TIER_COLORS[def.tier] }]}>
                  {def.tier}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
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
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  titlesCard: { marginBottom: spacing.lg },
  titleGrid: { gap: spacing.sm },
  titleChip: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
    opacity: 0.5,
  },
  titleChipUnlocked: { opacity: 1 },
  titleChipEquipped: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(196, 169, 98, 0.12)',
  },
  titleChipLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  titleChipLocked: { color: colors.textMuted },
  titleChipCondition: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  equippedBadge: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  achievementCard: { marginBottom: spacing.sm },
  achievementLocked: { opacity: 0.55 },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementIcon: { fontSize: 28 },
  lockedIcon: { opacity: 0.4 },
  achievementInfo: { flex: 1 },
  achievementTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  lockedText: { color: colors.textMuted },
  achievementDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tierText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
