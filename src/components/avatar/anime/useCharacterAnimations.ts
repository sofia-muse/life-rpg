import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { CharacterEvent } from './useExpressionState';

export function useCharacterAnimations(event: CharacterEvent = 'idle') {
  // Breathing
  const breathY = useRef(new Animated.Value(0)).current;
  // Hair sway
  const hairBackRotate = useRef(new Animated.Value(0)).current;
  const hairFrontRotate = useRef(new Animated.Value(0)).current;
  // Eye blink
  const eyeScaleY = useRef(new Animated.Value(1)).current;
  // Celebration bounce
  const bounceY = useRef(new Animated.Value(0)).current;
  // Power-up flash
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const blinkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Idle breathing loop
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathY, { toValue: -1.5, duration: 1500, useNativeDriver: true }),
        Animated.timing(breathY, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    breathing.start();
    return () => breathing.stop();
  }, []);

  // Hair sway loops
  useEffect(() => {
    const backSway = Animated.loop(
      Animated.sequence([
        Animated.timing(hairBackRotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(hairBackRotate, { toValue: -1, duration: 2000, useNativeDriver: true }),
      ]),
    );
    const frontSway = Animated.loop(
      Animated.sequence([
        Animated.timing(hairFrontRotate, { toValue: -0.8, duration: 2200, useNativeDriver: true }),
        Animated.timing(hairFrontRotate, { toValue: 0.8, duration: 2200, useNativeDriver: true }),
      ]),
    );
    backSway.start();
    setTimeout(() => frontSway.start(), 500);
    return () => {
      backSway.stop();
      frontSway.stop();
    };
  }, []);

  // Eye blink at random intervals
  useEffect(() => {
    const doBlink = () => {
      Animated.sequence([
        Animated.timing(eyeScaleY, { toValue: 0.1, duration: 75, useNativeDriver: true }),
        Animated.timing(eyeScaleY, { toValue: 1, duration: 75, useNativeDriver: true }),
      ]).start();
      scheduleNextBlink();
    };

    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      blinkTimeout.current = setTimeout(doBlink, delay);
    };

    scheduleNextBlink();
    return () => {
      if (blinkTimeout.current) clearTimeout(blinkTimeout.current);
    };
  }, []);

  // Event reactions
  useEffect(() => {
    if (event === 'questComplete') {
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -8, duration: 150, useNativeDriver: true }),
        Animated.spring(bounceY, { toValue: 0, friction: 3, useNativeDriver: true }),
      ]).start();
    } else if (event === 'levelUp' || event === 'tierUp') {
      Animated.sequence([
        Animated.timing(bounceY, {
          toValue: event === 'tierUp' ? -12 : -6,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(bounceY, {
          toValue: 0,
          friction: event === 'tierUp' ? 2.5 : 3.5,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } else if (event === 'rest') {
      Animated.sequence([
        Animated.timing(bounceY, { toValue: 4, duration: 220, useNativeDriver: true }),
        Animated.spring(bounceY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [event]);

  // Convert rotation values to interpolated strings
  const hairBackRotateInterp = hairBackRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const hairFrontRotateInterp = hairFrontRotate.interpolate({
    inputRange: [-0.8, 0.8],
    outputRange: ['-1.5deg', '1.5deg'],
  });

  return {
    breathY,
    hairBackRotate: hairBackRotateInterp,
    hairFrontRotate: hairFrontRotateInterp,
    eyeScaleY,
    bounceY,
    flashOpacity,
  };
}
