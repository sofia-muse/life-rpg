import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface Props {
  size: number;
  color: string;
  count: number;
  duration: number;
  active?: boolean;
}

const ANGLES = [0, 52, 128, 196, 250, 310];

export function LivingMotes({ size, color, count, duration, active = true }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return undefined;
    let stopped = false;

    const cycle = () => {
      if (stopped) return;
      spin.setValue(0);
      Animated.timing(spin, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !stopped) cycle();
      });
    };

    cycle();
    return () => {
      stopped = true;
      spin.stopAnimation();
    };
  }, [active, duration, spin]);

  if (!active || count <= 0) return null;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const radius = size / 2 + 10;
  const motes = ANGLES.slice(0, count);

  return (
    <Animated.View pointerEvents="none" style={[styles.orbit, { transform: [{ rotate }] }]}>
      <View style={styles.anchor}>
        {motes.map((angle, index) => (
          <View key={angle} style={[styles.arm, { transform: [{ rotate: `${angle}deg` }] }]}>
            <View
              style={[
                styles.mote,
                {
                  backgroundColor: color,
                  width: index % 2 === 0 ? 8 : 5,
                  height: index % 2 === 0 ? 8 : 5,
                  borderRadius: 5,
                  marginLeft: index % 2 === 0 ? -4 : -2.5,
                  marginTop: index % 2 === 0 ? -4 : -2.5,
                  opacity: index % 2 === 0 ? 0.9 : 0.65,
                  transform: [{ translateY: -radius }],
                },
              ]}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orbit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  anchor: {
    width: 0,
    height: 0,
  },
  arm: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  mote: {
    position: 'absolute',
  },
});
