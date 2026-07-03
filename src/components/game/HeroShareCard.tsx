import React, { useState } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { Hero, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { getStatDisplayProgress } from '../../engine/xpEngine';
import { NiceAvatarCharacter } from '../avatar/NiceAvatarCharacter';
import { Button } from '../layout/Button';
import { guidanceApi } from '../../api/guidanceApi';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { env } from '../../config/env';

interface Props {
  hero: Hero;
}

export function HeroShareCard({ hero }: Props) {
  const [sharingChronicle, setSharingChronicle] = useState(false);
  const [chronicleError, setChronicleError] = useState<string | null>(null);
  const aiSkillsEnabled = useSettingsStore((s) => s.aiSkillsEnabled);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const canUseGuidance = aiSkillsEnabled && !env.demoMode && authenticated;

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
      {/* Visual card */}
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <NiceAvatarCharacter
            appearance={hero.characterAppearance}
            dominantStat={hero.dominantStat}
            classTier={hero.classTier}
            size={70}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{hero.name}</Text>
            <Text style={[styles.cardClass, { color: STAT_COLORS[hero.dominantStat] }]}>
              {hero.className}
            </Text>
            <Text style={styles.cardLevel}>Hero Level {hero.heroLevel}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {STAT_NAMES.map((stat) => {
            const p = getStatDisplayProgress(hero.statXP[stat]);
            return (
              <View key={stat} style={styles.statItem}>
                <Text style={styles.statIcon}>{STAT_ICONS[stat]}</Text>
                <Text style={[styles.statLevel, { color: STAT_COLORS[stat] }]}>Lv.{p.level}</Text>
                <Text style={styles.statName}>{stat.slice(0, 3).toUpperCase()}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.totalQuestsCompleted}</Text>
            <Text style={styles.footerLabel}>Quests</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.currentStreak}</Text>
            <Text style={styles.footerLabel}>Streak</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerNum}>{hero.longestStreak}</Text>
            <Text style={styles.footerLabel}>Best</Text>
          </View>
        </View>
      </View>

      <Button title="Share Hero Card" onPress={handleShare} style={styles.shareBtn} />
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
    borderColor: colors.gold,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  cardInfo: { marginLeft: spacing.md, flex: 1 },
  cardName: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '900' },
  cardClass: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  cardLevel: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: { alignItems: 'center', width: '30%', marginBottom: spacing.sm },
  statIcon: { fontSize: 18 },
  statLevel: { fontSize: fontSize.md, fontWeight: '800' },
  statName: { color: colors.textMuted, fontSize: fontSize.xs },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerStat: { alignItems: 'center' },
  footerNum: { color: colors.textAccent, fontSize: fontSize.xl, fontWeight: '900' },
  footerLabel: { color: colors.textMuted, fontSize: fontSize.xs },
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
