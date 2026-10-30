import { Button } from '../layout/Button';
import { StoryFrame } from '../layout/StoryFrame';
import { Text } from '../layout/StoryText';
import { RPGIcon, LegacyRPGIcon } from './RPGIcon';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { AchievementDefinition } from '../../config/achievements';
import { colors, spacing, fontSize, radius, fonts } from '../../config/theme';

interface Props {
  visible: boolean;
  achievement: AchievementDefinition | null;
  onDismiss: () => void;
}

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
          <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
            <StoryFrame />
            <RPGIcon name="trophy" size={48} style={{ marginBottom: 10 }} />
            <Text style={styles.title}>ACHIEVEMENT!</Text>
            <LegacyRPGIcon symbol={achievement.icon} size={72} />
            <Text style={styles.name}>{achievement.title}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            <Text style={styles.tier}>{achievement.tier.toUpperCase()}</Text>
            <Button title="Claim Glory" onPress={onDismiss} />
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
    borderColor: colors.gold,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 440,
    alignItems: 'center',
  },
  sparkle: { fontSize: 48, marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.heading,
    textAlign: 'center',
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.lg,
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
    color: colors.textAccent,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
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
