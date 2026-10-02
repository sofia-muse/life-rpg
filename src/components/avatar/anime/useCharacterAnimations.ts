import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { CharacterEvent, Mood } from './useExpressionState';

export const MOOD_MOTION: Record<
  Mood,
  { breathMs: number; lift: number; scale: number; swayDeg: number; glance: number; orbitMs: number }
> = {
  happy: { breathMs: 900, lift: 18, scale: 1.12, swayDeg: 14, glance: 8, orbitMs: 3200 },
  neutral: { breathMs: 1200, lift: 16, scale: 1.1, swayDeg: 12, glance: 6, orbitMs: 4200 },
  sad: { breathMs: 1900, lift: 8, scale: 1.04, swayDeg: 5, glance: 3, orbitMs: 7600 },
};

interface Options {
  event?: CharacterEvent;
  eventNonce?: number;
  mood?: Mood;
  reduceMotion?: boolean;
  onBlink?: () => void;
}

export function useCharacterAnimations({
  event = 'idle',
  eventNonce = 0,
  mood = 'neutral',
  reduceMotion = false,
  onBlink,
}: Options = {}) {
  const breathY = useRef(new Animated.Value(0)).current;
  const breathScale = useRef(new Animated.Value(1)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const glanceShift = useRef(new Animated.Value(0)).current;
  const blinkSquash = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const reactionTilt = useRef(new Animated.Value(0)).current;
  const punchScale = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const onBlinkRef = useRef(onBlink);
  onBlinkRef.current = onBlink;

  const profile = MOOD_MOTION[mood];

  useEffect(() => {
    if (reduceMotion) {
      breathY.setValue(0);
      breathScale.setValue(1);
      sway.setValue(0);
      glanceShift.setValue(0);
      return undefined;
    }

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathY, {
            toValue: -profile.lift,
            duration: profile.breathMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathScale, {
            toValue: profile.scale,
            duration: profile.breathMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathY, {
            toValue: 0,
            duration: profile.breathMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathScale, {
            toValue: 1,
            duration: profile.breathMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const swaying = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: profile.breathMs * 1.8,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: profile.breathMs * 1.8,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const glancing = Animated.loop(
      Animated.sequence([
        Animated.timing(glanceShift, {
          toValue: 1,
          duration: profile.breathMs * 2.4,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glanceShift, {
          toValue: -1,
          duration: profile.breathMs * 2.4,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    breathing.start();
    swaying.start();
    const glanceDelay = setTimeout(() => glancing.start(), 400);

    return () => {
      clearTimeout(glanceDelay);
      breathing.stop();
      swaying.stop();
      glancing.stop();
    };
  }, [breathScale, breathY, glanceShift, profile, reduceMotion, sway]);

  useEffect(() => {
    if (reduceMotion) return undefined;

    let blinkTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const blink = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(blinkSquash, {
          toValue: 0.78,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.delay(340),
        Animated.timing(blinkSquash, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      onBlinkRef.current?.();
      blinkTimer = setTimeout(blink, 1600 + Math.random() * 1200);
    };

    blinkTimer = setTimeout(blink, 400 + Math.random() * 500);
    return () => {
      cancelled = true;
      if (blinkTimer) clearTimeout(blinkTimer);
    };
  }, [blinkSquash, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || event === 'idle') {
      bounceY.setValue(0);
      shakeX.setValue(0);
      reactionTilt.setValue(0);
      punchScale.setValue(1);
      flashOpacity.setValue(0);
      return undefined;
    }

    const reaction = reactionFor(event, {
      bounceY,
      shakeX,
      reactionTilt,
      punchScale,
      flashOpacity,
    });
    reaction.start();
    return () => reaction.stop();
  }, [bounceY, event, eventNonce, flashOpacity, punchScale, reactionTilt, reduceMotion, shakeX]);

  const bodyRotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${profile.swayDeg}deg`, `${profile.swayDeg}deg`],
  });
  const auraRotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['7deg', '-7deg'],
  });
  const glanceX = glanceShift.interpolate({
    inputRange: [-1, 1],
    outputRange: [-profile.glance, profile.glance],
  });
  const reactionRotate = reactionTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });
  const auraScale = breathScale.interpolate({
    inputRange: [1, 1.14],
    outputRange: [0.92, 1.18],
    extrapolate: 'clamp',
  });
  const flashScale = flashOpacity.interpolate({
    inputRange: [0, 0.75],
    outputRange: [0.96, 1.18],
  });

  return {
    breathY,
    breathScale,
    blinkSquash,
    bounceY,
    shakeX,
    punchScale,
    flashOpacity,
    bodyRotate,
    auraRotate,
    glanceX,
    reactionRotate,
    auraScale,
    flashScale,
    orbitMs: profile.orbitMs,
  };
}

function reactionFor(
  event: Exclude<CharacterEvent, 'idle'>,
  v: {
    bounceY: Animated.Value;
    shakeX: Animated.Value;
    reactionTilt: Animated.Value;
    punchScale: Animated.Value;
    flashOpacity: Animated.Value;
  },
) {
  const hop = (to: number, friction = 3) =>
    Animated.sequence([
      Animated.timing(v.bounceY, { toValue: to, duration: 150, useNativeDriver: true }),
      Animated.spring(v.bounceY, { toValue: 0, friction, useNativeDriver: true }),
    ]);

  const flash = (peak: number) =>
    Animated.sequence([
      Animated.timing(v.flashOpacity, { toValue: peak, duration: 140, useNativeDriver: true }),
      Animated.timing(v.flashOpacity, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]);

  const wobble = () =>
    Animated.sequence([
      Animated.timing(v.reactionTilt, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(v.reactionTilt, { toValue: -0.8, duration: 140, useNativeDriver: true }),
      Animated.spring(v.reactionTilt, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]);

  const shake = () =>
    Animated.sequence([
      Animated.timing(v.shakeX, { toValue: -7, duration: 45, useNativeDriver: true }),
      Animated.timing(v.shakeX, { toValue: 7, duration: 45, useNativeDriver: true }),
      Animated.timing(v.shakeX, { toValue: -5, duration: 40, useNativeDriver: true }),
      Animated.timing(v.shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(v.shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]);

  switch (event) {
    case 'questComplete':
      return Animated.parallel([hop(-12), wobble(), flash(0.38)]);
    case 'levelUp':
    case 'tierUp':
    case 'contractComplete': {
      const lift = event === 'tierUp' ? -18 : event === 'contractComplete' ? -14 : -15;
      const peak = event === 'tierUp' ? 0.78 : 0.62;
      const punch = event === 'tierUp' ? 1.14 : 1.08;
      return Animated.parallel([
        Animated.sequence([hop(lift, event === 'tierUp' ? 2.4 : 3), hop(lift * 0.45, 4)]),
        Animated.sequence([
          Animated.timing(v.punchScale, { toValue: punch, duration: 180, useNativeDriver: true }),
          Animated.spring(v.punchScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        flash(peak),
        wobble(),
      ]);
    }
    case 'rest':
      return Animated.parallel([
        Animated.sequence([
          Animated.timing(v.bounceY, { toValue: 6, duration: 260, useNativeDriver: true }),
          Animated.spring(v.bounceY, { toValue: 0, friction: 7, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(v.punchScale, { toValue: 0.96, duration: 220, useNativeDriver: true }),
          Animated.spring(v.punchScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]),
      ]);
    case 'bossPhase':
      return Animated.parallel([shake(), flash(0.28)]);
    case 'evolution':
      return Animated.parallel([hop(-10, 3.2), shake(), flash(0.55), wobble()]);
    default:
      return Animated.delay(0);
  }
}
