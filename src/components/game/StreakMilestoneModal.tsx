import { Button } from '../layout/Button';
import { StoryFrame } from '../layout/StoryFrame';
import { Text } from '../layout/StoryText';
import { RPGIcon } from './RPGIcon';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { colors, spacing, fontSize, radius, fonts } from '../../config/theme';

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
            <RPGIcon name="flame" size={72} style={{ marginBottom: 12 }} />
            <Text style={styles.title}>STREAK MILESTONE!</Text>
            <Text style={styles.days}>{days} Days</Text>
            <Text style={styles.name}>{title}</Text>
            <Text style={styles.multiplier}>XP multiplier ×{multiplier}</Text>
            <Button title="Keep the Flame" onPress={onDismiss} />
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
    borderColor: colors.warning,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 440,
    alignItems: 'center',
  },
  fire: { fontSize: 56, marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.heading,
    textAlign: 'center',
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
