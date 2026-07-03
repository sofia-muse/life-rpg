import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useHeroStore } from '../../store/heroStore';
import { NiceAvatarCharacter } from './NiceAvatarCharacter';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import {
  Gender,
  SkinTone,
  HairStyle,
  HairColor,
  EyeStyle,
  MouthStyle,
  GlassesStyle,
} from '../../types';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../../config/appearanceConfig';

export function CharacterCustomizer() {
  const hero = useHeroStore((s) => s.hero);
  const updateCharacterAppearance = useHeroStore((s) => s.updateCharacterAppearance);

  if (!hero) return null;

  const ca = hero.characterAppearance;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.preview}>
        <NiceAvatarCharacter
          appearance={ca}
          dominantStat={hero.dominantStat}
          classTier={hero.classTier}
          size={150}
        />
      </View>

      <Text style={styles.sectionTitle}>Gender</Text>
      <View style={styles.row}>
        {(['male', 'female'] as Gender[]).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.option, ca.gender === g && styles.optionActive]}
            onPress={() => updateCharacterAppearance({ gender: g })}
          >
            <Text style={[styles.optionText, ca.gender === g && styles.optionTextActive]}>
              {g === 'male' ? '♂ Male' : '♀ Female'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Skin Tone</Text>
      <View style={styles.row}>
        {([0, 1, 2, 3, 4, 5] as SkinTone[]).map((tone) => (
          <TouchableOpacity
            key={tone}
            style={[
              styles.swatch,
              { backgroundColor: SKIN_TONE_COLORS[tone] },
              ca.skinTone === tone && styles.swatchActive,
            ]}
            onPress={() => updateCharacterAppearance({ skinTone: tone })}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair Style</Text>
      <View style={styles.row}>
        {(['short', 'medium', 'long', 'shaved'] as HairStyle[]).map((hs) => (
          <TouchableOpacity
            key={hs}
            style={[styles.option, ca.hairStyle === hs && styles.optionActive]}
            onPress={() => updateCharacterAppearance({ hairStyle: hs })}
          >
            <Text style={[styles.optionText, ca.hairStyle === hs && styles.optionTextActive]}>
              {hs.charAt(0).toUpperCase() + hs.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair Color</Text>
      <View style={styles.row}>
        {([0, 1, 2, 3, 4] as HairColor[]).map((hc) => (
          <TouchableOpacity
            key={hc}
            style={[
              styles.swatch,
              { backgroundColor: HAIR_COLOR_VALUES[hc] },
              ca.hairColor === hc && styles.swatchActive,
            ]}
            onPress={() => updateCharacterAppearance({ hairColor: hc })}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Eyes</Text>
      <View style={styles.row}>
        {(['circle', 'oval', 'smile'] as EyeStyle[]).map((es) => (
          <TouchableOpacity
            key={es}
            style={[styles.option, ca.eyeStyle === es && styles.optionActive]}
            onPress={() => updateCharacterAppearance({ eyeStyle: es })}
          >
            <Text style={[styles.optionText, ca.eyeStyle === es && styles.optionTextActive]}>
              {es === 'circle' ? 'Round' : es === 'oval' ? 'Oval' : 'Happy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Mouth</Text>
      <View style={styles.row}>
        {(['laugh', 'smile', 'peace'] as MouthStyle[]).map((ms) => (
          <TouchableOpacity
            key={ms}
            style={[styles.option, ca.mouthStyle === ms && styles.optionActive]}
            onPress={() => updateCharacterAppearance({ mouthStyle: ms })}
          >
            <Text style={[styles.optionText, ca.mouthStyle === ms && styles.optionTextActive]}>
              {ms === 'laugh' ? 'Laugh' : ms === 'smile' ? 'Smile' : 'Chill'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Glasses</Text>
      <View style={styles.row}>
        {(['none', 'round', 'square'] as GlassesStyle[]).map((gs) => (
          <TouchableOpacity
            key={gs}
            style={[styles.option, ca.glassesStyle === gs && styles.optionActive]}
            onPress={() => updateCharacterAppearance({ glassesStyle: gs })}
          >
            <Text style={[styles.optionText, ca.glassesStyle === gs && styles.optionTextActive]}>
              {gs === 'none' ? 'None' : gs === 'round' ? 'Round' : 'Square'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Your outfit evolves as your class tier increases!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.xxl },
  preview: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radius.xxl,
    backgroundColor: colors.bgCardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.bgCardMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
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
    ...typography.bodyStrong,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  optionTextActive: {
    color: colors.textPrimary,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.gold,
    borderWidth: 3,
  },
  hint: {
    ...typography.journalItalic,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
