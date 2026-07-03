import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Skill, STAT_COLORS } from '../../types';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  skill: Skill;
  isUnlocked: boolean;
  progress: number;
  onPress: (skill: Skill) => void;
}

export function SkillNode({ skill, isUnlocked, progress, onPress }: Props) {
  const statColor = skill.requiredStat ? STAT_COLORS[skill.requiredStat] : colors.gold;
  const { isDesktop, isTablet } = useResponsive();
  const nodeSize = isDesktop ? 140 : isTablet ? 122 : 104;

  return (
    <TouchableOpacity
      style={[
        styles.node,
        { width: nodeSize, minHeight: nodeSize },
        isUnlocked ? { borderColor: statColor, backgroundColor: `${statColor}16` } : styles.locked,
      ]}
      onPress={() => onPress(skill)}
      activeOpacity={0.7}
    >
      <View style={[styles.nodeGlow, { backgroundColor: statColor }]} />
      <Text style={styles.icon}>{skill.icon}</Text>
      <Text style={[styles.name, isUnlocked ? { color: statColor } : styles.lockedText]}>
        {skill.name}
      </Text>
      <Text style={styles.requirement}>Lv. {skill.requiredLevel}</Text>
      {!isUnlocked && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: statColor },
            ]}
          />
        </View>
      )}
      {isUnlocked && <Text style={styles.unlocked}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  node: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  locked: {
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    opacity: 0.82,
  },
  nodeGlow: {
    position: 'absolute',
    top: -20,
    right: -16,
    width: 54,
    height: 54,
    borderRadius: 27,
    opacity: 0.14,
  },
  icon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.textMuted,
  },
  requirement: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  unlocked: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
