import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useShallow } from 'zustand/react/shallow';
import { Hero, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { getStatDisplayProgress } from '../../engine/xpEngine';
import { NiceAvatarCharacter } from '../avatar/NiceAvatarCharacter';
import { Button } from '../layout/Button';
import { guidanceApi } from '../../api/guidanceApi';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuestStore } from '../../store/questStore';
import { env } from '../../config/env';
import { getPrimaryContract } from '../../config/classContracts';
import { buildWeeklyChallengePayload, formatWeeklySnapshot } from '../../config/weeklyCompetition';
import { HeroCrest } from '../avatar/HeroCrest';
import { Badge } from '../layout/Badge';
import { FadeIn } from '../animated/FadeIn';
import { PulseGlow } from '../animated/PulseGlow';

interface Props {
  hero: Hero;
}

export function HeroShareCard({ hero }: Props) {
  const [sharingChronicle, setSharingChronicle] = useState(false);
  const [chronicleError, setChronicleError] = useState<string | null>(null);
  const settings = useSettingsStore(
    useShallow((s) => ({
      aiSkillsEnabled: s.aiSkillsEnabled,
      weeklyPath: s.weeklyPath,
      weeklyPathWeekKey: s.weeklyPathWeekKey,
      weeklyPathStartedAt: s.weeklyPathStartedAt,
      weeklyRewardWeekKey: s.weeklyRewardWeekKey,
      weeklyRewardTitle: s.weeklyRewardTitle,
      weeklyRewardBadge: s.weeklyRewardBadge,
    })),
  );
  const quests = useQuestStore((s) => s.quests);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const canUseGuidance = settings.aiSkillsEnabled && !env.demoMode && authenticated;

  const handleShareWeekly = async () => {
    const contract = getPrimaryContract(hero, settings, quests);
    const payload = buildWeeklyChallengePayload(hero, settings, contract, quests);
    if (!payload) {
      await Share.share({
        message: `${hero.name} is on a Life RPG campaign. Choose a weekly path on the sanctuary to begin!`,
        title: 'Life RPG Weekly Challenge',
      });
      return;
    }
    try {
      await Share.share({
        message: formatWeeklySnapshot(payload),
        title: 'Life RPG Weekly Snapshot',
      });
    } catch {
      // cancelled
    }
  };

  const handleShare = async () => {
    const statLines = STAT_NAMES.map((stat) => {
      const p = getStatDisplayProgress(hero.statXP[stat]);
      return `${STAT_ICONS[stat]} ${stat.charAt(0).toUpperCase() + stat.slice(1)}: Lv.${p.level}`;
    }).join('\n');

    const message =
      `Life RPG - Hero Card\n\n` +
      `⚔️ ${hero.name}\n` +
      `🏅 ${hero.className} (Tier ${hero.classTier})\n` +
      `⭐ Hero Level ${hero.heroLevel}\n` +
      `🔥 Streak: ${hero.currentStreak} days\n` +
      `✅ ${hero.totalQuestsCompleted} quests completed\n\n` +
      `📊 Stats:\n${statLines}\n\n` +
      `Build your class through action.`;

    try {
      await Share.share({
        message,
        title: `${hero.name}'s Hero Card`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleShareChronicle = async () => {
    setSharingChronicle(true);
    setChronicleError(null);

    try {
      const chronicle = await guidanceApi.getChronicle();
      const highlights = chronicle.highlights.map((highlight) => `- ${highlight}`).join('\n');
      const message = `${chronicle.title}\n\n${chronicle.narrative}${
        highlights ? `\n\nHighlights:\n${highlights}` : ''
      }`;

      await Share.share({
        message,
        title: chronicle.title,
      });
    } catch (error) {
      setChronicleError(error instanceof Error ? error.message : 'Chronicle failed');
    } finally {
      setSharingChronicle(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(124,92,252,0.06)', 'rgba(196,169,98,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.cardVeil} />
        <View pointerEvents="none" style={styles.cornerAccent} />
        <FadeIn slideFrom="none" scaleFrom={0.97} duration={500}>
          <View style={styles.cardHeader}>
            <View style={styles.identityBlock}>
              <PulseGlow
                color={STAT_COLORS[hero.dominantStat]}
                intensity="strong"
                style={styles.avatarGlow}
              >
                <NiceAvatarCharacter
                  appearance={hero.characterAppearance}
                  dominantStat={hero.dominantStat}
                  classTier={hero.classTier}
                  size={78}
                />
              </PulseGlow>
              <View style={styles.cardInfo}>
                <Text style={styles.overline}>Hero Chronicle</Text>
                <Text style={styles.cardName}>{hero.name}</Text>
                <Badge
                  label={`${hero.className} • Tier ${hero.classTier}`}
                  color={STAT_COLORS[hero.dominantStat]}
                />
                <Text style={styles.cardLevel}>Hero Level {hero.heroLevel}</Text>
              </View>
            </View>
            <HeroCrest hero={hero} size={90} variant="compact" />
          </View>
        </FadeIn>

        <View style={styles.bannerRow}>
          <Text style={styles.bannerLabel}>Dominant Path</Text>
          <Text style={[styles.bannerValue, { color: STAT_COLORS[hero.dominantStat] }]}>
            {hero.dominantStat.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {STAT_NAMES.map((stat, index) => {
            const p = getStatDisplayProgress(hero.statXP[stat]);
            return (
              <FadeIn
                key={stat}
                delay={index * 45}
                duration={420}
                slideFrom="bottom"
                slideDistance={10}
                scaleFrom={0.96}
                style={styles.statItem}
              >
                <Text style={styles.statIcon}>{STAT_ICONS[stat]}</Text>
                <Text style={[styles.statLevel, { color: STAT_COLORS[stat] }]}>Lv.{p.level}</Text>
                <Text style={styles.statName}>{stat.slice(0, 3).toUpperCase()}</Text>
              </FadeIn>
            );
          })}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.totalQuestsCompleted}</Text>
            <Text style={styles.footerLabel}>Quests Honored</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.currentStreak}</Text>
            <Text style={styles.footerLabel}>Sacred Streak</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.longestStreak}</Text>
            <Text style={styles.footerLabel}>Best Vigil</Text>
          </View>
        </View>
      </View>

      <Button title="Share Hero Card" onPress={handleShare} style={styles.shareBtn} />
      <Button
        title="Share Weekly Snapshot"
        onPress={() => void handleShareWeekly()}
        variant="secondary"
        style={styles.chronicleBtn}
      />
      {canUseGuidance && (
        <Button
          title={sharingChronicle ? 'Writing Chronicle…' : 'Share AI Chronicle'}
          onPress={handleShareChronicle}
          variant="secondary"
          loading={sharingChronicle}
          style={styles.chronicleBtn}
        />
      )}
      {chronicleError && <Text style={styles.errorText}>{chronicleError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  cardInner: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.goldLight,
    overflow: 'hidden',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  cardVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.veil,
  },
  cornerAccent: {
    position: 'absolute',
    top: -28,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.amethystGlow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarGlow: {
    width: 104,
    height: 104,
    marginRight: spacing.md,
  },
  cardInfo: { flex: 1 },
  overline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  cardName: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  cardLevel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    ...typography.body,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(15, 15, 26, 0.45)',
  },
  bannerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  bannerValue: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    ...typography.headingWide,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    width: '31%',
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.sm + 2,
  },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statLevel: { fontSize: fontSize.md, fontWeight: '800', ...typography.headingWide },
  statName: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2, ...typography.headingWide },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerStat: { alignItems: 'center', flex: 1 },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  footerNum: {
    color: colors.textAccent,
    fontSize: fontSize.xl,
    fontWeight: '900',
    ...typography.heading,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
    ...typography.headingWide,
  },
  shareBtn: {
    marginBottom: spacing.sm,
  },
  chronicleBtn: {
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
  },
});
