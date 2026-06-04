import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Hero, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { getStatDisplayProgress } from '../../engine/xpEngine';
import { NiceAvatarCharacter } from '../avatar/NiceAvatarCharacter';

interface Props {
  hero: Hero;
}

export function HeroShareCard({ hero }: Props) {
  const handleShare = async () => {
    const statLines = STAT_NAMES.map((stat) => {
      const p = getStatDisplayProgress(hero.statXP[stat]);
      return `${STAT_ICONS[stat]} ${stat.charAt(0).toUpperCase() + stat.slice(1)}: Lv.${p.level}`;
    }).join('\n');

    const message =
      `🎮 Life RPG - Hero Card\n\n` +
      `⚔️ ${hero.name}\n` +
      `🏅 ${hero.className} (Tier ${hero.classTier})\n` +
      `⭐ Hero Level ${hero.heroLevel}\n` +
      `🔥 Streak: ${hero.currentStreak} days\n` +
      `✅ ${hero.totalQuestsCompleted} quests completed\n\n` +
      `📊 Stats:\n${statLines}\n\n` +
      `Level up your real life! 💪`;

    try {
      await Share.share({
        message,
        title: `${hero.name}'s Hero Card`,
      });
    } catch {
      // User cancelled
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

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share Hero Card</Text>
      </TouchableOpacity>
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
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.bgPrimary, fontSize: fontSize.md, fontWeight: '700' },
});
