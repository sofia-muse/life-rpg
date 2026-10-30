import { Button } from '../layout/Button';
import { StoryFrame } from '../layout/StoryFrame';
import { Text } from '../layout/StoryText';
import { RPGIcon } from './RPGIcon';
import React, { useEffect, useRef } from 'react';
import { Modal, Animated, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';

interface Props {
  visible: boolean;
  rankName: string;
  nextTitle?: string;
  onDismiss: () => void;
}

export function EvolutionModal({ visible, rankName, nextTitle, onDismiss }: Props) {
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
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity }]}>
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
            <RPGIcon name="crown" size={72} style={{ marginBottom: 12 }} />
            <Text style={styles.title}>Quest Evolved!</Text>
            <Text style={styles.rank}>Rank: {rankName}</Text>
            {nextTitle ? (
              <Text style={styles.next}>Your quest has grown into: {nextTitle}</Text>
            ) : null}
            <Button title="Continue" onPress={onDismiss} />
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: {
    textAlign: 'center',
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginBottom: spacing.sm,
    ...typography.headingWide,
  },
  rank: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  next: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    ...typography.body,
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  btnText: {
    color: colors.bgPrimary,
    fontWeight: '700',
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
  },
});
