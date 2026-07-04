import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
  intensity?: 'soft' | 'medium' | 'strong';
}

const INTENSITY = {
  soft: { halo: 0.16, ring: 0.22, scale: 1.08 },
  medium: { halo: 0.24, ring: 0.3, scale: 1.12 },
  strong: { halo: 0.32, ring: 0.4, scale: 1.18 },
} as const;

export function PulseGlow({
  children,
  color = colors.gold,
  style,
  active = true,
  intensity = 'medium',
}: Props) {
  const config = INTENSITY[intensity];
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(config.halo)).current;
  const ringScale = useRef(new Animated.Value(0.94)).current;
  const ringOpacity = useRef(new Animated.Value(config.ring)).current;

  useEffect(() => {
    if (!active) {
      haloOpacity.setValue(0);
      ringOpacity.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: config.scale,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: config.halo + 0.12,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: config.scale + 0.06,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: config.ring * 0.35,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: config.halo,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 0.94,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: config.ring,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [active, config.halo, config.ring, config.scale, haloOpacity, haloScale, ringOpacity, ringScale]);

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            backgroundColor: color,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
  },
  content: {
    zIndex: 1,
  },
});
