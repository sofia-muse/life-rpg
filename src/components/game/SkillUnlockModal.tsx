import { Button } from '../layout/Button';
import { StoryFrame } from '../layout/StoryFrame';
import { Text } from '../layout/StoryText';
import { RPGIcon } from './RPGIcon';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { Skill, STAT_COLORS } from '../../types';
import { colors, spacing, fontSize, radius, fonts } from '../../config/theme';

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
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.content, { transform: [{ scale }], borderColor: statColor }]}
          >
            <StoryFrame />
            <RPGIcon name="crystal" size={48} style={{ marginBottom: 10 }} />
            <Text style={styles.title}>SKILL UNLOCKED!</Text>
            <RPGIcon name={skill.requiredStat ?? 'crystal'} size={72} />
            <Text style={[styles.name, { color: statColor }]}>{skill.name}</Text>
            <Text style={styles.description}>{skill.description}</Text>
            <View style={styles.effectBox}>
              <Text style={styles.effectLabel}>Effect:</Text>
              <Text style={styles.effectText}>{skill.effect}</Text>
            </View>
            <Button title="Excellent!" onPress={onDismiss} />
          </Animated.View>
        </ScrollView>
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
    width: '90%',
    maxWidth: 440,
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.heading,
    textAlign: 'center',
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
