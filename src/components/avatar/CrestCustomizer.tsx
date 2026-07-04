import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useHeroStore } from '../../store/heroStore';
import { HeroCrest } from './HeroCrest';
import { StatRadar } from './StatRadar';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { AccentOverride, CrestShape, HeroAppearance, SigilStyle, STAT_COLORS, STAT_NAMES } from '../../types';
import { APPEARANCE_UNLOCKS, ACCENT_COLORS } from '../../config/appearanceConfig';
import { Card } from '../layout/Card';
import { FadeIn } from '../animated/FadeIn';

const SHAPE_LABELS: Record<CrestShape, string> = {
  shield: '🛡️',
  circle: '⭕',
  diamond: '💠',
  hexagon: '⬡',
};

const SIGIL_LABELS: Record<SigilStyle, string> = {
  sword: '⚔️',
  flame: '🔥',
  eye: '👁️',
  star: '⭐',
  tree: '🌳',
  crown: '👑',
};

type FocusArea = 'shape' | 'sigil' | 'accent' | 'title' | 'radar';

const FOCUS_COPY: Record<FocusArea, { title: string; hint: string; scale: number; lift: number; turn: number }> = {
  shape: {
    title: 'Define the sacred frame',
    hint: 'The outer form establishes the crest’s authority before its symbol is read.',
    scale: 1.06,
    lift: 0,
    turn: 0,
  },
  sigil: {
    title: 'Invoke the sigil',
    hint: 'The inner mark is the soul of the crest, so the preview leans closer to the symbol.',
    scale: 1.14,
    lift: -10,
    turn: 2,
  },
  accent: {
    title: 'Light the metalwork',
    hint: 'Accent colors change whether the crest feels austere, radiant, or elemental.',
    scale: 1.1,
    lift: -6,
    turn: -2,
  },
  title: {
    title: 'Reveal the title ribbon',
    hint: 'The class title can make the crest feel heraldic or keep it elegantly restrained.',
    scale: 1.08,
    lift: 4,
    turn: 0,
  },
  radar: {
    title: 'Read the stat constellation',
    hint: 'The radar reveals which disciplines now shine brightest within your banner.',
    scale: 1.02,
    lift: 0,
    turn: 0,
  },
};

export function CrestCustomizer() {
  const hero = useHeroStore((s) => s.hero);
  const updateAppearance = useHeroStore((s) => s.updateAppearance);
  const [focus, setFocus] = useState<FocusArea>('shape');
  const previewScale = useRef(new Animated.Value(FOCUS_COPY.shape.scale)).current;
  const previewLift = useRef(new Animated.Value(FOCUS_COPY.shape.lift)).current;
  const previewTurn = useRef(new Animated.Value(FOCUS_COPY.shape.turn)).current;

  const appearance = hero?.appearance;
  const focusCopy = FOCUS_COPY[focus];
  const previewRotate = previewTurn.interpolate({
    inputRange: [-6, 6],
    outputRange: ['-6deg', '6deg'],
  });

  useEffect(() => {
    const next = FOCUS_COPY[focus];
    Animated.parallel([
      Animated.spring(previewScale, { toValue: next.scale, friction: 7, useNativeDriver: true }),
      Animated.spring(previewLift, { toValue: next.lift, friction: 7, useNativeDriver: true }),
      Animated.spring(previewTurn, { toValue: next.turn, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [focus, previewLift, previewScale, previewTurn]);

  if (!hero || !appearance) return null;

  const accentOptions: { key: AccentOverride; color: string; label: string }[] = [
    { key: 'none', color: STAT_COLORS[hero.dominantStat], label: 'Auto' },
    ...STAT_NAMES.map((s) => ({
      key: s as AccentOverride,
      color: STAT_COLORS[s],
      label: s.slice(0, 3).toUpperCase(),
    })),
    { key: 'gold', color: ACCENT_COLORS.gold, label: 'Gold' },
    { key: 'silver', color: ACCENT_COLORS.silver, label: 'Silver' },
  ];

  const applyAppearance = (
    patch: Partial<Pick<HeroAppearance, 'crestShape' | 'sigil' | 'accentOverride' | 'titleDisplay'>>,
    nextFocus: FocusArea,
  ) => {
    setFocus(nextFocus);
    updateAppearance(patch);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn slideFrom="bottom" slideDistance={16} duration={460} scaleFrom={0.98}>
        <Card style={styles.previewCard}>
          <Text style={styles.previewOverline}>Sacred Banner</Text>
          <Text style={styles.previewTitle}>{focusCopy.title}</Text>
          <Text style={styles.previewHint}>{focusCopy.hint}</Text>
          <View style={styles.previewStage}>
            <Animated.View
              style={{
                transform: [
                  { translateY: previewLift },
                  { scale: previewScale },
                  { rotate: previewRotate },
                ],
              }}
            >
              <HeroCrest hero={hero} size={166} variant="editor" />
            </Animated.View>
          </View>
          <View style={styles.focusTabs}>
            {(Object.keys(FOCUS_COPY) as FocusArea[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.focusTab, focus === key && styles.focusTabActive]}
                onPress={() => setFocus(key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.focusTabText, focus === key && styles.focusTabTextActive]}>
                  {key === 'shape'
                    ? 'Frame'
                    : key === 'sigil'
                      ? 'Sigil'
                      : key === 'accent'
                        ? 'Accent'
                        : key === 'title'
                          ? 'Title'
                          : 'Radar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={40} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Frame</Text>
          <Text style={styles.sectionTitle}>Crest shape</Text>
          <Text style={styles.sectionHint}>Choose the ceremonial silhouette that carries the banner.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
            {(['shield', 'circle', 'diamond', 'hexagon'] as CrestShape[]).map((shape) => {
              const isUnlocked = appearance.unlockedCrestShapes.includes(shape);
              const isSelected = appearance.crestShape === shape;
              const unlock = APPEARANCE_UNLOCKS.find((u) => u.type === 'shape' && u.id === shape);

              return (
                <TouchableOpacity
                  key={shape}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    !isUnlocked && styles.optionLocked,
                  ]}
                  onPress={() => isUnlocked && applyAppearance({ crestShape: shape }, 'shape')}
                  activeOpacity={isUnlocked ? 0.78 : 1}
                >
                  <Text style={styles.optionIcon}>{SHAPE_LABELS[shape]}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                  </Text>
                  <Text style={[styles.unlockText, !isUnlocked && styles.unlockTextLocked]}>
                    {isUnlocked ? 'Unlocked' : unlock?.condition}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>
      </FadeIn>

      <FadeIn delay={80} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Sigil</Text>
          <Text style={styles.sectionTitle}>Inner mark</Text>
          <Text style={styles.sectionHint}>The sigil defines what power the crest is remembered for.</Text>
          <View style={styles.grid}>
            {(['sword', 'flame', 'eye', 'star', 'tree', 'crown'] as SigilStyle[]).map((sig) => {
              const isUnlocked = appearance.unlockedSigils.includes(sig);
              const isSelected = appearance.sigil === sig;
              const unlock = APPEARANCE_UNLOCKS.find((u) => u.type === 'sigil' && u.id === sig);

              return (
                <TouchableOpacity
                  key={sig}
                  style={[
                    styles.gridOption,
                    isSelected && styles.optionSelected,
                    !isUnlocked && styles.optionLocked,
                  ]}
                  onPress={() => isUnlocked && applyAppearance({ sigil: sig }, 'sigil')}
                  activeOpacity={isUnlocked ? 0.78 : 1}
                >
                  <Text style={styles.gridIcon}>{SIGIL_LABELS[sig]}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {sig.charAt(0).toUpperCase() + sig.slice(1)}
                  </Text>
                  <Text style={[styles.unlockTextSmall, !isUnlocked && styles.unlockTextLocked]}>
                    {isUnlocked ? 'Awakened' : unlock?.condition}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={120} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Metalwork</Text>
          <Text style={styles.sectionTitle}>Accent color</Text>
          <Text style={styles.sectionHint}>Tune the glow of the crest without losing its dominant-stat identity.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
            {accentOptions.map((opt) => {
              const isSelected = appearance.accentOverride === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.colorOption, isSelected && { borderColor: opt.color }]}
                  onPress={() => applyAppearance({ accentOverride: opt.key }, 'accent')}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: opt.color }]} />
                  <Text style={[styles.colorLabel, isSelected && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>
      </FadeIn>

      <FadeIn delay={160} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Heraldry</Text>
          <Text style={styles.sectionTitle}>Title ribbon</Text>
          <Text style={styles.sectionHint}>Choose whether the class title is spoken aloud by the crest.</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleLabel}>Show Class Title</Text>
              <Text style={styles.toggleHint}>
                Keep the heraldic ribbon visible beneath the crest.
              </Text>
            </View>
            <Switch
              value={appearance.titleDisplay}
              onValueChange={(v) => applyAppearance({ titleDisplay: v }, 'title')}
              trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
              thumbColor={appearance.titleDisplay ? colors.gold : colors.textMuted}
            />
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={200} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Constellation</Text>
          <Text style={styles.sectionTitle}>Stat profile</Text>
          <Text style={styles.sectionHint}>Your stat radar becomes the hidden astronomy beneath the crest.</Text>
          <View style={styles.radarCard}>
            <StatRadar stats={hero.stats} size={200} opacity={0.85} showLabels />
          </View>
        </Card>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  previewCard: {
    marginBottom: spacing.md,
  },
  previewOverline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '800',
    ...typography.heading,
  },
  previewHint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: spacing.xs,
    ...typography.body,
  },
  previewStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  focusTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  focusTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
  },
  focusTabActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}18`,
  },
  focusTabText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  focusTabTextActive: {
    color: colors.goldBright,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionOverline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    ...typography.headingWide,
  },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginBottom: spacing.md,
    ...typography.body,
  },
  picker: {
    flexDirection: 'row',
  },
  option: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 90,
    minHeight: 112,
    justifyContent: 'center',
  },
  optionSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  optionLocked: {
    opacity: 0.4,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  optionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    ...typography.heading,
  },
  optionLabelSelected: {
    color: colors.goldBright,
  },
  unlockText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.body,
  },
  unlockTextLocked: {
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridOption: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    width: '30%',
    minWidth: 90,
    minHeight: 118,
    justifyContent: 'center',
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  unlockTextSmall: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
    ...typography.body,
  },
  colorOption: {
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(15, 15, 26, 0.4)',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  colorLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    ...typography.headingWide,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
    ...typography.heading,
  },
  toggleHint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
    ...typography.body,
  },
  radarCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(15, 15, 26, 0.45)',
  },
});
