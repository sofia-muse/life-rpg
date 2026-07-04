import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideFrom?: 'bottom' | 'left' | 'right' | 'none';
  slideDistance?: number;
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 400,
  slideFrom = 'bottom',
  slideDistance = 20,
  scaleFrom = 1,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(slideFrom === 'none' ? 0 : slideDistance)).current;
  const scale = useRef(new Animated.Value(scaleFrom)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ];

    if (scaleFrom !== 1) {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    if (slideFrom !== 'none') {
      animations.push(
        Animated.timing(translate, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(animations).start();
  }, [delay, duration, opacity, scale, scaleFrom, slideFrom, translate]);

  const transform =
    slideFrom === 'bottom'
      ? [{ translateY: translate }]
      : slideFrom === 'left'
        ? [{ translateX: Animated.multiply(translate, -1) }]
        : slideFrom === 'right'
          ? [{ translateX: translate }]
          : [];

  return <Animated.View style={[{ opacity, transform: [...transform, { scale }] }, style]}>{children}</Animated.View>;
}
