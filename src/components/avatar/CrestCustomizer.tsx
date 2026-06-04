import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useHeroStore } from '../../store/heroStore';
import { HeroCrest } from './HeroCrest';
import { StatRadar } from './StatRadar';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import { CrestShape, SigilStyle, AccentOverride, STAT_COLORS, STAT_NAMES } from '../../types';
import { APPEARANCE_UNLOCKS, ACCENT_COLORS } from '../../config/appearanceConfig';

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

export function CrestCustomizer() {
  const hero = useHeroStore((s) => s.hero);
  const updateAppearance = useHeroStore((s) => s.updateAppearance);

  if (!hero) return null;

  const appearance = hero.appearance;

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Live Preview */}
      <View style={styles.preview}>
        <HeroCrest hero={hero} size={150} />
      </View>

      {/* Crest Shape */}
      <Text style={styles.sectionTitle}>Crest Shape</Text>
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
              onPress={() => isUnlocked && updateAppearance({ crestShape: shape })}
              activeOpacity={isUnlocked ? 0.7 : 1}
            >
              <Text style={styles.optionIcon}>{SHAPE_LABELS[shape]}</Text>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </Text>
              {!isUnlocked && <Text style={styles.lockText}>🔒 {unlock?.condition}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sigil */}
      <Text style={styles.sectionTitle}>Sigil</Text>
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
              onPress={() => isUnlocked && updateAppearance({ sigil: sig })}
              activeOpacity={isUnlocked ? 0.7 : 1}
            >
              <Text style={styles.gridIcon}>{SIGIL_LABELS[sig]}</Text>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {sig.charAt(0).toUpperCase() + sig.slice(1)}
              </Text>
              {!isUnlocked && <Text style={styles.lockTextSmall}>🔒 {unlock?.condition}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Accent Color */}
      <Text style={styles.sectionTitle}>Accent Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
        {accentOptions.map((opt) => {
          const isSelected = appearance.accentOverride === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.colorOption, isSelected && { borderColor: opt.color }]}
              onPress={() => updateAppearance({ accentOverride: opt.key })}
            >
              <View style={[styles.colorSwatch, { backgroundColor: opt.color }]} />
              <Text style={[styles.colorLabel, isSelected && { color: opt.color }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Title Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show Class Title</Text>
        <Switch
          value={appearance.titleDisplay}
          onValueChange={(v) => updateAppearance({ titleDisplay: v })}
          trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
          thumbColor={appearance.titleDisplay ? colors.gold : colors.textMuted}
        />
      </View>

      {/* Stat Radar */}
      <Text style={styles.sectionTitle}>Stat Profile</Text>
      <View style={styles.radarContainer}>
        <StatRadar stats={hero.stats} size={200} opacity={0.8} showLabels />
      </View>
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
  preview: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
  },
  optionLabelSelected: {
    color: colors.gold,
  },
  lockText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  lockTextSmall: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  colorOption: {
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: radius.md,
    padding: spacing.sm,
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
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
