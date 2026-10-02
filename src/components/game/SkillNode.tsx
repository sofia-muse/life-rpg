import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Skill, STAT_COLORS } from '../../types';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import AppLottie from '../animated/AppLottie';

interface Props {
  skill: Skill;
  isUnlocked: boolean;
  progress: number;
  onPress: (skill: Skill) => void;
  /** Draw the edge toward the previous node. */
  showLink?: boolean;
  /** Lit edge from the previous node in the lane. */
  linked?: boolean;
  sparkle?: boolean;
}

export function SkillNode({
  skill,
  isUnlocked,
  progress,
  onPress,
  showLink = false,
  linked = false,
  sparkle = false,
}: Props) {
  const statColor = skill.requiredStat ? STAT_COLORS[skill.requiredStat] : colors.gold;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isUnlocked) {
      pulse.setValue(1);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isUnlocked, pulse]);

  return (
    <View style={styles.wrap}>
      {showLink ? (
        linked ? (
          <View style={[styles.link, { backgroundColor: statColor }]} />
        ) : (
          <View style={styles.linkDim} />
        )
      ) : null}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[
            styles.node,
            isUnlocked ? { borderColor: statColor, backgroundColor: `${statColor}20` } : styles.locked,
          ]}
          onPress={() => onPress(skill)}
          activeOpacity={0.7}
        >
          {sparkle ? (
            <AppLottie
              source={require('../../../assets/animations/sparkle.json')}
              autoPlay
              loop={false}
              style={styles.sparkle}
            />
          ) : null}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  link: {
    position: 'absolute',
    left: -8,
    top: 48,
    width: 16,
    height: 3,
    borderRadius: radius.full,
    opacity: 0.9,
  },
  linkDim: {
    position: 'absolute',
    left: -8,
    top: 48,
    width: 16,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    opacity: 0.45,
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 48,
    height: 48,
  },
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
