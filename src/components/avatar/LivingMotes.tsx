import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface Props {
  color: string;
  count: number;
  duration: number;
  orbit: number;
  active?: boolean;
}

const ANGLES = [0, 72, 144, 216, 288];

export function LivingMotes({ color, count, duration, orbit, active = true }: Props) {
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
  const motes = ANGLES.slice(0, count);

  return (
    <Animated.View pointerEvents="none" style={[styles.orbit, { transform: [{ rotate }] }]}>
      <View style={styles.anchor}>
        <View
          style={[
            styles.ring,
            {
              width: orbit * 2,
              height: orbit * 2,
              marginLeft: -orbit,
              marginTop: -orbit,
              borderRadius: orbit,
              borderColor: color,
            },
          ]}
        />
        {motes.map((angle, index) => {
          const dot = index % 2 === 0 ? 12 : 8;
          return (
            <View key={angle} style={[styles.arm, { transform: [{ rotate: `${angle}deg` }] }]}>
              <View
                style={[
                  styles.mote,
                  {
                    backgroundColor: color,
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    marginLeft: -dot / 2,
                    marginTop: -dot / 2,
                    transform: [{ translateY: -orbit }],
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orbit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  anchor: {
    width: 0,
    height: 0,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
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
