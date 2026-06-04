import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { StatName, STAT_COLORS, STAT_ICONS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  stat: StatName;
  newLevel: number;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, stat, newLevel, onDismiss }: Props) {
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <LottieView
            source={require('../../../assets/animations/levelup.json')}
            autoPlay
            loop={false}
            speed={0.6}
            style={styles.lottieEffect}
          />
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>LEVEL UP!</Text>
          <View style={[styles.statBadge, { borderColor: statColor }]}>
            <Text style={styles.statIcon}>{STAT_ICONS[stat]}</Text>
            <Text style={[styles.statName, { color: statColor }]}>
              {stat.charAt(0).toUpperCase() + stat.slice(1)}
            </Text>
          </View>
          <Text style={[styles.level, { color: statColor }]}>Level {newLevel}</Text>
          <Text style={styles.flavor}>Your {stat} grows ever stronger!</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: statColor }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Onward!</Text>
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
  lottieEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -20,
    zIndex: -1,
  },
  trophy: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.title,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statIcon: {
    fontSize: 24,
  },
  statName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  level: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  flavor: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
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
