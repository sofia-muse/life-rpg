import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { ClassTier } from '../../types';
import { TIER_BADGES } from '../../config/avatarConfig';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  newTier: ClassTier;
  newClass: string;
  onDismiss: () => void;
}

export function TierUpModal({ visible, newTier, newClass, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.1);
      rotation.setValue(0);
    }
  }, [visible]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <Animated.Text style={[styles.badge, { transform: [{ rotate: spin }] }]}>
            {TIER_BADGES[newTier]}
          </Animated.Text>
          <Text style={styles.title}>CLASS EVOLUTION!</Text>
          <Text style={styles.className}>{newClass}</Text>
          <Text style={styles.tierLabel}>Tier {newTier}</Text>
          <View style={styles.stars}>
            {Array.from({ length: newTier }, (_, i) => (
              <Text key={i} style={styles.star}>
                ⭐
              </Text>
            ))}
          </View>
          <Text style={styles.flavor}>
            Your dedication has transformed you into something greater!
          </Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Embrace Power!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.gold,
    padding: spacing.xl,
    width: '85%',
    alignItems: 'center',
  },
  badge: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: spacing.md,
  },
  className: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  tierLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.lg,
  },
  star: {
    fontSize: 24,
  },
  flavor: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.gold,
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
