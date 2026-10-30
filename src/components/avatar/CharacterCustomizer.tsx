import { Text } from '../layout/StoryText';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useHeroStore } from '../../store/heroStore';
import { NiceAvatarCharacter } from './NiceAvatarCharacter';
import { PortraitPicker } from './PortraitPicker';
import {
  CharacterAppearance,
  Gender,
  SkinTone,
  HairStyle,
  HairColor,
  EyeStyle,
  MouthStyle,
  GlassesStyle,
  ClassFlair,
} from '../../types';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../../config/appearanceConfig';
import { Card } from '../layout/Card';
import { colors, spacing, typography } from '../../config/theme';

function Choices<T extends string>({
  title,
  values,
  selected,
  onSelect,
  labels,
}: {
  title: string;
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.row}>
        {values.map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${labels?.[value] ?? value}`}
            accessibilityState={{ selected: selected === value }}
            style={[styles.option, selected === value && styles.selected]}
          >
            <Text style={styles.optionText}>
              {labels?.[value] ?? value.charAt(0).toUpperCase() + value.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
export function CharacterCustomizer() {
  const hero = useHeroStore((s) => s.hero);
  const update = useHeroStore((s) => s.updateCharacterAppearance);
  const { width } = useWindowDimensions();
  if (!hero) return null;
  const ca = hero.characterAppearance;
  const patch = (value: Partial<CharacterAppearance>) => update(value);
  return (
    <View style={styles.container}>
      <Card>
        <Text accessibilityRole="header" style={styles.title}>
          Your storybook portrait
        </Text>
        <View style={styles.preview}>
          <NiceAvatarCharacter
            appearance={ca}
            dominantStat={hero.dominantStat}
            classTier={hero.classTier}
            size={Math.min(280, Math.max(160, width - 104))}
          />
        </View>
        <Text style={styles.saved}>Changes are saved as you choose.</Text>
        <PortraitPicker appearance={ca} onChange={patch} />
      </Card>
      {ca.portraitStyle === 'illustrated' && (
        <Card>
          <Text style={styles.title}>Make it yours</Text>
          <Choices<Gender>
            title="Gender"
            values={['female', 'male']}
            selected={ca.gender}
            onSelect={(gender) => patch({ gender })}
          />
          <Text style={styles.label}>Skin tone</Text>
          <View style={styles.row}>
            {SKIN_TONE_COLORS.map((color, i) => (
              <TouchableOpacity
                key={color}
                onPress={() => patch({ skinTone: i as SkinTone })}
                accessibilityRole="button"
                accessibilityLabel={`Skin tone ${i + 1}`}
                accessibilityState={{ selected: ca.skinTone === i }}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  ca.skinTone === i && styles.selected,
                ]}
              />
            ))}
          </View>
          <Choices<HairStyle>
            title="Hair style"
            values={['short', 'medium', 'long', 'shaved']}
            selected={ca.hairStyle}
            onSelect={(hairStyle) => patch({ hairStyle })}
          />
          <Text style={styles.label}>Hair color</Text>
          <View style={styles.row}>
            {HAIR_COLOR_VALUES.map((color, i) => (
              <TouchableOpacity
                key={color}
                onPress={() => patch({ hairColor: i as HairColor })}
                accessibilityRole="button"
                accessibilityLabel={`Hair color ${i + 1}`}
                accessibilityState={{ selected: ca.hairColor === i }}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  ca.hairColor === i && styles.selected,
                ]}
              />
            ))}
          </View>
          <Choices<EyeStyle>
            title="Eyes"
            values={['circle', 'oval', 'smile']}
            selected={ca.eyeStyle}
            labels={{ circle: 'Round', oval: 'Oval', smile: 'Happy' }}
            onSelect={(eyeStyle) => patch({ eyeStyle })}
          />
          <Choices<MouthStyle>
            title="Expression"
            values={['laugh', 'smile', 'peace']}
            selected={ca.mouthStyle}
            onSelect={(mouthStyle) => patch({ mouthStyle })}
          />
          <Choices<GlassesStyle>
            title="Glasses"
            values={['none', 'round', 'square']}
            selected={ca.glassesStyle}
            onSelect={(glassesStyle) => patch({ glassesStyle })}
          />
          <Choices<ClassFlair>
            title="Class detail"
            values={['auto', 'circlet', 'mantle', 'pauldrons']}
            selected={ca.classFlair ?? 'auto'}
            onSelect={(classFlair) => patch({ classFlair })}
          />
        </Card>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 24, ...typography.heading },
  preview: { alignItems: 'center', paddingVertical: spacing.lg },
  saved: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  group: { marginTop: 16 },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 44,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
  },
  selected: { borderWidth: 2, borderColor: colors.gold },
  optionText: { color: colors.textPrimary, fontSize: 14 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
