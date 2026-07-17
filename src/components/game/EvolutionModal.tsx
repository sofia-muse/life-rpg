import React, { useEffect, useRef } from 'react';
import { Modal, Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>⬆️</Text>
          <Text style={styles.title}>Quest Evolved!</Text>
          <Text style={styles.rank}>Rank: {rankName}</Text>
          {nextTitle ? (
            <Text style={styles.next}>Your quest has grown into: {nextTitle}</Text>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
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
