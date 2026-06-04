import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Skill, STAT_COLORS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  skill: Skill;
  isUnlocked: boolean;
  progress: number;
  onPress: (skill: Skill) => void;
}

export function SkillNode({ skill, isUnlocked, progress, onPress }: Props) {
  const statColor = skill.requiredStat ? STAT_COLORS[skill.requiredStat] : colors.gold;

  return (
    <TouchableOpacity
      style={[
        styles.node,
        isUnlocked ? { borderColor: statColor, backgroundColor: `${statColor}20` } : styles.locked,
      ]}
      onPress={() => onPress(skill)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{skill.icon}</Text>
      <Text style={[styles.name, isUnlocked ? { color: statColor } : styles.lockedText]}>
        {skill.name}
      </Text>
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
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    padding: spacing.xs,
  },
  locked: {
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    opacity: 0.7,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  name: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedText: {
    color: colors.textMuted,
  },
  progressBar: {
    width: '80%',
    height: 3,
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    marginTop: 4,
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
    marginTop: 2,
  },
});
