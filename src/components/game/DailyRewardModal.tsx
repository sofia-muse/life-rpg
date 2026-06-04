import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { StatName, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  xp: number;
  stat: StatName;
  bonusType: string;
  loginDays: number;
  onClaim: () => void;
}

export function DailyRewardModal({ visible, xp, stat, bonusType, loginDays, onClaim }: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.3);
      opacity.setValue(0);
    }
  }, [visible]);

  const statColor = STAT_COLORS[stat];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClaim}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <LottieView
            source={require('../../../assets/animations/sparkle.json')}
            autoPlay
            loop={false}
            speed={0.8}
            style={styles.lottie}
          />
          <Text style={styles.gift}>🎁</Text>
          <Text style={styles.title}>DAILY REWARD</Text>
          <Text style={styles.bonusType}>{bonusType}</Text>

          <View style={[styles.xpBox, { borderColor: statColor }]}>
            <Text style={styles.xpIcon}>{STAT_ICONS[stat]}</Text>
            <Text style={[styles.xpAmount, { color: statColor }]}>+{xp} XP</Text>
          </View>

          <Text style={styles.statLabel}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</Text>

          <View style={styles.daysRow}>
            <Text style={styles.daysLabel}>Day {loginDays}</Text>
            <View style={styles.daysBar}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <View
                  key={d}
                  style={[styles.dayDot, d <= (loginDays % 7 || 7) && styles.dayDotActive]}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: statColor }]}
            onPress={onClaim}
          >
            <Text style={styles.buttonText}>Claim!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
    borderColor: colors.gold,
    padding: spacing.xl,
    width: '80%',
    alignItems: 'center',
  },
  lottie: { position: 'absolute', width: 200, height: 200, top: -30 },
  gift: { fontSize: 56, marginBottom: spacing.sm },
  title: {
    color: colors.gold,
    fontSize: fontSize.title,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  bonusType: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  xpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  xpIcon: { fontSize: 24 },
  xpAmount: { fontSize: fontSize.xxl, fontWeight: '900' },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  daysRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  daysLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  daysBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayDotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.bgPrimary, fontSize: fontSize.lg, fontWeight: '800' },
});
