import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUIStore } from '../../store/uiStore';

interface Props {
  children: React.ReactNode;
}

/** Short horizontal hit-shake driven by `uiStore.shakeNonce`. */
export function ScreenShake({ children }: Props) {
  const nonce = useUIStore((s) => s.shakeNonce);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!nonce) return;
    offset.value = withSequence(
      withTiming(-7, { duration: 35 }),
      withTiming(7, { duration: 40 }),
      withTiming(-4, { duration: 35 }),
      withTiming(0, { duration: 40 }),
    );
  }, [nonce, offset]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
