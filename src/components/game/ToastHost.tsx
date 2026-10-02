import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../config/theme';
import { useUIStore } from '../../store/uiStore';

function ToastRow({ id, message }: { id: string; message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const dismissToast = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) dismissToast(id);
    });
    return () => animation.stop();
  }, [dismissToast, id, opacity, translateY]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.host}>
      {toasts.map((toast) => (
        <ToastRow key={toast.id} id={toast.id} message={toast.message} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    zIndex: 50,
    gap: spacing.xs,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: 'rgba(16, 16, 32, 0.94)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 420,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
});
