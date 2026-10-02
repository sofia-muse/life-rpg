import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import AppLottie from '../animated/AppLottie';
import { AchievementDefinition, AchievementTier } from '../../config/achievements';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  achievement: AchievementDefinition | null;
  onDismiss: () => void;
}

const TIER_BORDER: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: colors.gold,
  mythic: '#B388FF',
};

export function AchievementUnlockModal({ visible, achievement, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } else {
      scale.setValue(0.3);
    }
  }, [visible, scale]);

  if (!achievement) return null;

  const borderColor = TIER_BORDER[achievement.tier] ?? colors.gold;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { borderColor, transform: [{ scale }] }]}>
          <AppLottie
            source={require('../../../assets/animations/sparkle.json')}
            autoPlay
            loop={false}
            speed={0.8}
            style={styles.lottie}
          />
          <Text style={styles.title}>ACHIEVEMENT!</Text>
          <Text style={styles.icon}>{achievement.icon}</Text>
          <Text style={styles.name}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
          <Text style={[styles.tier, { color: borderColor }]}>
            {achievement.tier.toUpperCase()}
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: borderColor }]} onPress={onDismiss}>
            <Text style={styles.buttonText}>Claim Glory</Text>
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
    overflow: 'hidden',
  },
  lottie: {
    position: 'absolute',
    width: 220,
    height: 220,
    top: -20,
    opacity: 0.85,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  icon: { fontSize: 56, marginBottom: spacing.sm },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '900',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tier: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.lg,
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
