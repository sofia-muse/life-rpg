import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppLottieHandle, AppLottieProps } from './AppLottie.types';
import { colors } from '../../config/theme';

const SPARKS = [
  { x: -22, y: 10, delay: 0 },
  { x: 18, y: 6, delay: 0.08 },
  { x: -4, y: 16, delay: 0.16 },
  { x: 8, y: -8, delay: 0.05 },
  { x: -12, y: -4, delay: 0.2 },
];

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

const AppLottie = React.forwardRef<AppLottieHandle, AppLottieProps>(
  ({ autoPlay = false, loop = false, speed = 1, style, variant = 'aura' }, ref) => {
    const tempo = speed > 0 ? speed : 1;

    if (variant === 'sparkle') {
      return <SparkleBurst ref={ref} style={style} tempo={tempo} />;
    }
    if (variant === 'levelup') {
      return <LevelBurst ref={ref} style={style} tempo={tempo} />;
    }
    return <AuraHalo ref={ref} autoPlay={autoPlay} loop={loop} style={style} tempo={tempo} />;
  },
);

AppLottie.displayName = 'AppLottie';

export default AppLottie;

const AuraHalo = React.forwardRef<
  AppLottieHandle,
  { autoPlay: boolean; loop: boolean; style?: AppLottieProps['style']; tempo: number }
>(({ autoPlay, loop, style, tempo }, ref) => {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (!autoPlay) return undefined;
    const duration = 4200 / tempo;
    const spinning = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const base = Animated.sequence([
      Animated.timing(pulse, { toValue: 0.7, duration: 1400 / tempo, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.2, duration: 1600 / tempo, useNativeDriver: true }),
    ]);
    const breathing = loop ? Animated.loop(base) : base;
    spinning.start();
    breathing.start();
    return () => {
      spinning.stop();
      breathing.stop();
    };
  }, [autoPlay, loop, pulse, spin, tempo]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        pulse.setValue(0.85);
      },
      reset: () => {
        pulse.setValue(0.25);
      },
    }),
    [pulse],
  );

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View pointerEvents="none" style={style}>
      <Animated.View
        style={[
          styles.ring,
          { borderColor: colors.goldBright, opacity: pulse, transform: [{ rotate }, { scale: 1.04 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ringDashed,
          { opacity: pulse, transform: [{ rotate: counter }, { scale: 0.82 }] },
        ]}
      />
    </View>
  );
});

AuraHalo.displayName = 'AuraHalo';

const SparkleBurst = React.forwardRef<
  AppLottieHandle,
  { style?: AppLottieProps['style']; tempo: number }
>(({ style, tempo }, ref) => {
  const burst = useRef(new Animated.Value(0)).current;

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        burst.setValue(0);
        Animated.timing(burst, {
          toValue: 1,
          duration: 900 / tempo,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
      reset: () => {
        burst.stopAnimation();
        burst.setValue(0);
      },
    }),
    [burst, tempo],
  );

  return (
    <View pointerEvents="none" style={style}>
      <View style={styles.anchor}>
        {SPARKS.map((spark) => {
          const start = spark.delay;
          const opacity = burst.interpolate({
            inputRange: [start, start + 0.18, 0.72, 1],
            outputRange: [0, 1, 1, 0],
            extrapolate: 'clamp',
          });
          const translateY = burst.interpolate({
            inputRange: [0, 1],
            outputRange: [spark.y, spark.y - 42],
          });
          const scale = burst.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [0.3, 1.15, 0.4],
          });
          return (
            <Animated.View
              key={`${spark.x}-${spark.y}`}
              style={[
                styles.spark,
                {
                  opacity,
                  transform: [
                    { translateX: spark.x },
                    { translateY },
                    { scale },
                    { rotate: '45deg' },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
});

SparkleBurst.displayName = 'SparkleBurst';

const LevelBurst = React.forwardRef<
  AppLottieHandle,
  { style?: AppLottieProps['style']; tempo: number }
>(({ style, tempo }, ref) => {
  const burst = useRef(new Animated.Value(0)).current;

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        burst.setValue(0);
        Animated.timing(burst, {
          toValue: 1,
          duration: 1100 / tempo,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
      reset: () => {
        burst.stopAnimation();
        burst.setValue(0);
      },
    }),
    [burst, tempo],
  );

  const ringScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.35] });
  const ringOpacity = burst.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.9, 0],
  });
  const rayScale = burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.2, 1, 1.15] });

  return (
    <View pointerEvents="none" style={style}>
      <View style={styles.anchor}>
        <Animated.View
          style={[styles.levelRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        {RAYS.map((angle) => (
          <Animated.View
            key={angle}
            style={[styles.arm, { opacity: ringOpacity, transform: [{ rotate: `${angle}deg` }] }]}
          >
            <Animated.View style={[styles.ray, { transform: [{ translateY: -34 }, { scaleY: rayScale }] }]} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
});

LevelBurst.displayName = 'LevelBurst';

const styles = StyleSheet.create({
  anchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arm: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
  },
  ringDashed: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gold,
  },
  spark: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 1,
    backgroundColor: colors.goldBright,
  },
  levelRing: {
    width: '72%',
    height: '72%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.goldBright,
  },
  ray: {
    width: 2,
    height: 14,
    marginLeft: -1,
    borderRadius: 2,
    backgroundColor: colors.goldBright,
  },
});
