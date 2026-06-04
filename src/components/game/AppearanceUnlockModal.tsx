import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, radius } from '../../config/theme';

interface Props {
  visible: boolean;
  type: 'shape' | 'sigil';
  name: string;
  onDismiss: () => void;
}

export function AppearanceUnlockModal({ visible, type, name, onDismiss }: Props) {
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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>NEW UNLOCK!</Text>
          <Text style={styles.subtitle}>{type === 'shape' ? 'Crest Shape' : 'Sigil'} Unlocked</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.hint}>Visit the customization screen to try it out!</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Awesome!</Text>
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
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.title,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
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
