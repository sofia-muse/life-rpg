import React from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CharacterAppearance } from '../../types';
import { PAINTED_PORTRAITS, getPaintedPortrait } from '../../config/paintedPortraits';
import { colors, spacing, typography } from '../../config/theme';

export function PortraitPicker({
  appearance,
  onChange,
}: {
  appearance: CharacterAppearance;
  onChange: (patch: Partial<CharacterAppearance>) => void;
}) {
  const painted = appearance.portraitStyle !== 'illustrated';
  const selected = getPaintedPortrait(appearance);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {(['painted', 'illustrated'] as const).map((style) => (
          <TouchableOpacity
            key={style}
            accessibilityRole="button"
            accessibilityState={{ selected: painted === (style === 'painted') }}
            onPress={() => onChange({ portraitStyle: style })}
            style={[styles.mode, painted === (style === 'painted') && styles.selected]}
          >
            <Text style={styles.label}>
              {style === 'painted' ? 'Painted portraits' : 'Custom illustration'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {painted && (
        <>
          <Text style={styles.hint}>Choose a complete hand-painted look. </Text>
          <View style={styles.row}>
            {PAINTED_PORTRAITS.map((portrait) => (
              <TouchableOpacity
                key={portrait.id}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${portrait.name}`}
                accessibilityState={{ selected: selected.id === portrait.id }}
                onPress={() =>
                  onChange({
                    portraitStyle: 'painted',
                    portraitId: portrait.id,
                    gender: portrait.gender,
                  })
                }
                style={[styles.tile, selected.id === portrait.id && styles.selected]}
              >
                <Image
                  source={portrait.source}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  accessible={false}
                />
                <Text style={styles.name}>
                  {selected.id === portrait.id ? '✓ ' : ''}
                  {portrait.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>{selected.description}</Text>
        </>
      )}
      {!painted && (
        <Text style={styles.hint}>
          Build a stylized illustration with your own colors, features and accessories.
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md, width: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mode: {
    flex: 1,
    minWidth: 100,
    minHeight: 48,
    padding: 12,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selected: { borderColor: colors.gold, backgroundColor: colors.goldSoft, borderWidth: 2 },
  label: { color: colors.textPrimary, fontSize: 14, textAlign: 'center' },
  tile: {
    flex: 1,
    minWidth: 100,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.bgInset,
  },
  thumbnail: { width: '100%', aspectRatio: 1 },
  name: {
    color: colors.textPrimary,
    padding: 10,
    fontSize: 14,
    lineHeight: 20,
    ...typography.bodyStrong,
  },
  hint: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
