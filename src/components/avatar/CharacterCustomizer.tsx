import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHeroStore } from '../../store/heroStore';
import { NiceAvatarCharacter } from './NiceAvatarCharacter';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import {
  CharacterAppearance,
  Gender,
  SkinTone,
  HairStyle,
  HairColor,
  EyeStyle,
  MouthStyle,
  GlassesStyle,
} from '../../types';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../../config/appearanceConfig';
import { Card } from '../layout/Card';
import { PulseGlow } from '../animated/PulseGlow';
import { FadeIn } from '../animated/FadeIn';

type FocusArea = 'identity' | 'palette' | 'hair' | 'expression' | 'accessories';

const FOCUS_COPY: Record<FocusArea, { title: string; hint: string; scale: number; lift: number; tilt: number }> =
  {
    identity: {
      title: 'Shape the first impression',
      hint: 'Choose the hero silhouette and base presence that the world meets first.',
      scale: 1.04,
      lift: 0,
      tilt: 0,
    },
    palette: {
      title: 'Refine the palette',
      hint: 'Skin and hair tones set the warmth, contrast, and aura of the portrait.',
      scale: 1.08,
      lift: -6,
      tilt: -2,
    },
    hair: {
      title: 'Crown the silhouette',
      hint: 'Hair shape changes the outline most dramatically, so the preview leans into the crown.',
      scale: 1.12,
      lift: -10,
      tilt: 2,
    },
    expression: {
      title: 'Awaken the expression',
      hint: 'Eyes and mouth define the spirit of the portrait, so the preview pulls in closer.',
      scale: 1.18,
      lift: -16,
      tilt: 0,
    },
    accessories: {
      title: 'Add a finishing relic',
      hint: 'Accessories are the final accent that turns a character into a signature presence.',
      scale: 1.12,
      lift: -10,
      tilt: 3,
    },
  };

export function CharacterCustomizer() {
  const hero = useHeroStore((s) => s.hero);
  const updateCharacterAppearance = useHeroStore((s) => s.updateCharacterAppearance);
  const [focus, setFocus] = useState<FocusArea>('identity');
  const previewScale = useRef(new Animated.Value(FOCUS_COPY.identity.scale)).current;
  const previewLift = useRef(new Animated.Value(FOCUS_COPY.identity.lift)).current;
  const previewTilt = useRef(new Animated.Value(FOCUS_COPY.identity.tilt)).current;
  const ca = hero?.characterAppearance;
  const focusCopy = FOCUS_COPY[focus];
  const previewRotate = previewTilt.interpolate({
    inputRange: [-6, 6],
    outputRange: ['-6deg', '6deg'],
  });

  useEffect(() => {
    const next = FOCUS_COPY[focus];
    Animated.parallel([
      Animated.spring(previewScale, { toValue: next.scale, friction: 7, useNativeDriver: true }),
      Animated.spring(previewLift, { toValue: next.lift, friction: 7, useNativeDriver: true }),
      Animated.spring(previewTilt, { toValue: next.tilt, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [focus, previewLift, previewScale, previewTilt]);

  if (!hero || !ca) return null;

  const applyPatch = (patch: Partial<CharacterAppearance>, nextFocus: FocusArea) => {
    setFocus(nextFocus);
    updateCharacterAppearance(patch);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn slideFrom="bottom" slideDistance={16} duration={460} scaleFrom={0.98}>
        <Card style={styles.previewCard}>
          <Text style={styles.previewOverline}>Living Portrait</Text>
          <Text style={styles.previewTitle}>{focusCopy.title}</Text>
          <Text style={styles.previewHint}>{focusCopy.hint}</Text>
          <View style={styles.previewStage}>
            <PulseGlow color={colors.gold} intensity="strong" style={styles.previewGlow}>
              <Animated.View
                style={{
                  transform: [
                    { translateY: previewLift },
                    { scale: previewScale },
                    { rotate: previewRotate },
                  ],
                }}
              >
                <NiceAvatarCharacter
                  appearance={ca}
                  dominantStat={hero.dominantStat}
                  classTier={hero.classTier}
                  size={168}
                />
              </Animated.View>
            </PulseGlow>
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
                  {key === 'identity'
                    ? 'Identity'
                    : key === 'palette'
                      ? 'Palette'
                      : key === 'hair'
                        ? 'Crown'
                        : key === 'expression'
                          ? 'Expression'
                          : 'Accent'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={40} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Identity</Text>
          <Text style={styles.sectionTitle}>Core silhouette</Text>
          <Text style={styles.sectionHint}>Set the base form of the portrait before refining details.</Text>
          <View style={styles.row}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.option, ca.gender === g && styles.optionActive]}
                onPress={() => applyPatch({ gender: g }, 'identity')}
              >
                <Text style={[styles.optionText, ca.gender === g && styles.optionTextActive]}>
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={80} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Palette</Text>
          <Text style={styles.sectionTitle}>Skin and hair color</Text>
          <Text style={styles.sectionHint}>Shape the warmth and contrast of your hero’s portrait.</Text>

          <Text style={styles.subsectionTitle}>Skin Tone</Text>
          <View style={styles.swatchRow}>
            {([0, 1, 2, 3, 4, 5] as SkinTone[]).map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[styles.swatchOption, ca.skinTone === tone && styles.swatchOptionActive]}
                onPress={() => applyPatch({ skinTone: tone }, 'palette')}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: SKIN_TONE_COLORS[tone] },
                    ca.skinTone === tone && styles.swatchActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Hair Color</Text>
          <View style={styles.swatchRow}>
            {([0, 1, 2, 3, 4] as HairColor[]).map((hc) => (
              <TouchableOpacity
                key={hc}
                style={[styles.swatchOption, ca.hairColor === hc && styles.swatchOptionActive]}
                onPress={() => applyPatch({ hairColor: hc }, 'palette')}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: HAIR_COLOR_VALUES[hc] },
                    ca.hairColor === hc && styles.swatchActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={120} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Crown</Text>
          <Text style={styles.sectionTitle}>Hair silhouette</Text>
          <Text style={styles.sectionHint}>Shift the outline of the portrait with a stronger or softer crown.</Text>
          <View style={styles.row}>
            {(['short', 'medium', 'long', 'shaved'] as HairStyle[]).map((hs) => (
              <TouchableOpacity
                key={hs}
                style={[styles.option, ca.hairStyle === hs && styles.optionActive]}
                onPress={() => applyPatch({ hairStyle: hs }, 'hair')}
              >
                <Text style={[styles.optionText, ca.hairStyle === hs && styles.optionTextActive]}>
                  {hs.charAt(0).toUpperCase() + hs.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={160} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Expression</Text>
          <Text style={styles.sectionTitle}>Eyes and mouth</Text>
          <Text style={styles.sectionHint}>Fine-tune the emotion your hero carries at a glance.</Text>

          <Text style={styles.subsectionTitle}>Eyes</Text>
          <View style={styles.row}>
            {(['circle', 'oval', 'smile'] as EyeStyle[]).map((es) => (
              <TouchableOpacity
                key={es}
                style={[styles.option, ca.eyeStyle === es && styles.optionActive]}
                onPress={() => applyPatch({ eyeStyle: es }, 'expression')}
              >
                <Text style={[styles.optionText, ca.eyeStyle === es && styles.optionTextActive]}>
                  {es === 'circle' ? 'Round' : es === 'oval' ? 'Oval' : 'Happy'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Mouth</Text>
          <View style={styles.row}>
            {(['laugh', 'smile', 'peace'] as MouthStyle[]).map((ms) => (
              <TouchableOpacity
                key={ms}
                style={[styles.option, ca.mouthStyle === ms && styles.optionActive]}
                onPress={() => applyPatch({ mouthStyle: ms }, 'expression')}
              >
                <Text style={[styles.optionText, ca.mouthStyle === ms && styles.optionTextActive]}>
                  {ms === 'laugh' ? 'Laugh' : ms === 'smile' ? 'Smile' : 'Chill'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={200} slideFrom="bottom" slideDistance={14} scaleFrom={0.99}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionOverline}>Accent</Text>
          <Text style={styles.sectionTitle}>Finishing touch</Text>
          <Text style={styles.sectionHint}>A small accessory can completely change the vibe of the portrait.</Text>
          <View style={styles.row}>
            {(['none', 'round', 'square'] as GlassesStyle[]).map((gs) => (
              <TouchableOpacity
                key={gs}
                style={[styles.option, ca.glassesStyle === gs && styles.optionActive]}
                onPress={() => applyPatch({ glassesStyle: gs }, 'accessories')}
              >
                <Text style={[styles.optionText, ca.glassesStyle === gs && styles.optionTextActive]}>
                  {gs === 'none' ? 'None' : gs === 'round' ? 'Round' : 'Square'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </FadeIn>

      <Text style={styles.hint}>Your outfit continues to evolve as your class tier rises.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  previewCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
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
  previewGlow: {
    width: 250,
    height: 250,
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
  subsectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    ...typography.heading,
  },
  optionTextActive: {
    color: colors.goldBright,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchOption: {
    padding: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 15, 26, 0.4)',
  },
  swatchOptionActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}18`,
  },
  swatch: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.goldBright,
    borderWidth: 3,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
    ...typography.journal,
  },
});
