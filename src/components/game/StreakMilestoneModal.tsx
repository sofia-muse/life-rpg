import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  days: number;
  title: string;
  multiplier: number;
  onDismiss: () => void;
}

export function StreakMilestoneModal({ visible, days, title, multiplier, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } else {
      scale.setValue(0.3);
    }
  }, [visible, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <Text style={styles.fire}>🔥</Text>
          <Text style={styles.title}>STREAK MILESTONE!</Text>
          <Text style={styles.days}>{days} Days</Text>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.multiplier}>XP multiplier ×{multiplier}</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Keep the Flame</Text>
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
    borderColor: colors.warning,
    padding: spacing.xl,
    width: '80%',
    alignItems: 'center',
  },
  fire: { fontSize: 56, marginBottom: spacing.sm },
  title: {
    color: colors.warning,
    fontSize: fontSize.xl,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  days: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.textAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  multiplier: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.warning,
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
