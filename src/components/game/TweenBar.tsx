import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../config/theme';

interface Props {
  progress: number;
  color: string;
  height?: number;
}

/** Width tween plus a brief color flash whenever the fill changes. */
export function TweenBar({ progress, color, height = 8 }: Props) {
  const width = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.spring(width, {
      toValue: clamped,
      friction: 7,
      tension: 70,
      useNativeDriver: false,
    }).start();
    flash.setValue(0.85);
    Animated.timing(flash, {
      toValue: 0,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [clamped, flash, width]);

  const widthInterpolation = width.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, width: widthInterpolation }]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { backgroundColor: color, opacity: flash }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
});
