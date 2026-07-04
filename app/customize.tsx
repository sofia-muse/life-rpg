import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CharacterCustomizer } from '../src/components/avatar/CharacterCustomizer';
import { CrestCustomizer } from '../src/components/avatar/CrestCustomizer';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';
import { FadeIn } from '../src/components/animated/FadeIn';
import { HeroCrest } from '../src/components/avatar/HeroCrest';
import { useHeroStore } from '../src/store/heroStore';

type Tab = 'character' | 'crest';

export default function CustomizeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('character');
  const hero = useHeroStore((s) => s.hero);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgCanvas, colors.bgPrimary, colors.bgPrimary]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.backgroundOrbTop} />
      <View pointerEvents="none" style={styles.backgroundOrbBottom} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Return</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.overline}>Hero Atelier</Text>
          <Text style={styles.title}>Forge Your Presence</Text>
          <Text style={styles.subtitle}>
            Refine your visage and sigil until your legend feels unmistakably yours.
          </Text>
        </View>
        <View style={styles.headerSide}>
          {hero ? <HeroCrest hero={hero} size={74} variant="compact" /> : null}
        </View>
      </View>

      {hero && (
        <FadeIn delay={80} slideFrom="bottom" slideDistance={14} scaleFrom={0.98}>
          <View style={styles.statusBanner}>
            <Text style={styles.statusLabel}>Current Focus</Text>
            <Text style={styles.statusValue}>
              {tab === 'character' ? 'Character Forging' : 'Crest Consecration'}
            </Text>
            <Text style={styles.statusHint}>
              {tab === 'character'
                ? `${hero.name}'s expression, silhouette, and personal style.`
                : `${hero.className}'s banner, sigil, and ceremonial colorwork.`}
            </Text>
          </View>
        </FadeIn>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'character' && styles.tabActive]}
          onPress={() => setTab('character')}
        >
          <Text style={[styles.tabEyebrow, tab === 'character' && styles.tabEyebrowActive]}>Body</Text>
          <Text style={[styles.tabText, tab === 'character' && styles.tabTextActive]}>
            Character
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'crest' && styles.tabActive]}
          onPress={() => setTab('crest')}
        >
          <Text style={[styles.tabEyebrow, tab === 'crest' && styles.tabEyebrowActive]}>Relic</Text>
          <Text style={[styles.tabText, tab === 'crest' && styles.tabTextActive]}>Crest</Text>
        </TouchableOpacity>
      </View>

      <FadeIn key={tab} delay={0} slideFrom="bottom" slideDistance={14} duration={320} scaleFrom={0.99}>
        {tab === 'character' ? <CharacterCustomizer /> : <CrestCustomizer />}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.amethystGlow,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.goldSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 72,
    paddingTop: spacing.sm,
  },
  backText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '600',
    ...typography.headingWide,
  },
  headerCopy: {
    flex: 1,
  },
  headerSide: {
    minWidth: 74,
    alignItems: 'flex-end',
  },
  overline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: spacing.xs,
    ...typography.body,
  },
  statusBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(15, 15, 26, 0.58)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: 2,
    ...typography.headingWide,
  },
  statusValue: {
    color: colors.goldBright,
    fontSize: fontSize.lg,
    fontWeight: '800',
    ...typography.heading,
  },
  statusHint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.xs,
    ...typography.body,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15, 15, 26, 0.6)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabActive: {
    backgroundColor: `${colors.gold}18`,
    borderColor: colors.gold,
  },
  tabEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: 2,
    ...typography.headingWide,
  },
  tabEyebrowActive: {
    color: colors.goldLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '700',
    ...typography.heading,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
});
