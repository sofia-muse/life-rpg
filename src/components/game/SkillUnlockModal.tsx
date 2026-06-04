import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { Skill, STAT_COLORS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  skill: Skill | null;
  onDismiss: () => void;
}

export function SkillUnlockModal({ visible, skill, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } else {
      scale.setValue(0.3);
    }
  }, [visible]);

  if (!skill) return null;

  const statColor = skill.requiredStat ? STAT_COLORS[skill.requiredStat] : colors.gold;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { transform: [{ scale }], borderColor: statColor }]}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={styles.title}>SKILL UNLOCKED!</Text>
          <Text style={styles.icon}>{skill.icon}</Text>
          <Text style={[styles.name, { color: statColor }]}>{skill.name}</Text>
          <Text style={styles.description}>{skill.description}</Text>
          <View style={styles.effectBox}>
            <Text style={styles.effectLabel}>Effect:</Text>
            <Text style={styles.effectText}>{skill.effect}</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: statColor }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Excellent!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 2,
    padding: spacing.xl,
    width: '80%',
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  effectBox: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  effectLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  effectText: {
    color: colors.textAccent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    color: colors.bgPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
});
