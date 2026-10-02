import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import AppLottie from '../animated/AppLottie';

const EMBERS = [0, 1, 2, 3, 4, 5];

/** Sparks that rise inside their parent. Used as the tavern hearth fire. */
export function SanctuaryEmbers({ period }: { period: 'dawn' | 'day' | 'dusk' | 'night' }) {
  const night = period === 'night' || period === 'dusk';
  return (
    <View pointerEvents="none" style={styles.emberLayer}>
      <AppLottie
        source={require('../../../assets/animations/aura-glow.json')}
        autoPlay
        loop
        style={[styles.aura, { opacity: night ? 0.7 : 0.28 }]}
      />
      {EMBERS.map((index) => (
        <Ember key={index} index={index} bright={night} />
      ))}
    </View>
  );
}

function Ember({ index, bright }: { index: number; bright: boolean }) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rise, { toValue: 1, duration: 2800 + index * 380, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [index, rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [8, -46 - index * 6] });
  const opacity = rise.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, bright ? 0.9 : 0.4, 0] });

  return (
    <Animated.View
      style={[
        styles.ember,
        {
          left: `${16 + (index % 3) * 24}%`,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  emberLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    left: -8,
    right: -8,
    bottom: -6,
    height: 72,
  },
  ember: {
    position: 'absolute',
    bottom: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F2B15A',
  },
});
