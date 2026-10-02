import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import Avatar from '@zamplyy/react-native-nice-avatar';
import { CharacterAppearance, ClassTier, StatName, STAT_COLORS } from '../../types';
import { buildNiceAvatarConfig } from '../../config/anime/niceAvatarConfig';
import { useCharacterAnimations } from './anime/useCharacterAnimations';
import { useExpressionState, CharacterEvent } from './anime/useExpressionState';
import { useHeroStore } from '../../store/heroStore';
import AppLottie from '../animated/AppLottie';
import { AppLottieHandle } from '../animated/AppLottie.types';
import { PulseGlow } from '../animated/PulseGlow';
import { LivingMotes } from './LivingMotes';
import { colors } from '../../config/theme';

interface Props {
  appearance: CharacterAppearance;
  dominantStat: StatName;
  classTier: ClassTier;
  size?: number;
  event?: CharacterEvent;
  eventNonce?: number;
}

export function NiceAvatarCharacter({
  appearance,
  dominantStat,
  classTier,
  size = 80,
  event = 'idle',
  eventNonce = 0,
}: Props) {
  const hero = useHeroStore((s) => s.hero);
  const { mood } = useExpressionState(hero);
  const [blinking, setBlinking] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBlink = useCallback(() => {
    setBlinking(true);
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    blinkTimer.current = setTimeout(() => setBlinking(false), 700);
  }, []);

  const anims = useCharacterAnimations({
    event,
    eventNonce,
    mood,
    reduceMotion,
    onBlink,
  });
  const accentColor = STAT_COLORS[dominantStat];

  const sparkleRef = useRef<AppLottieHandle>(null);
  const levelUpRef = useRef<AppLottieHandle>(null);

  useEffect(() => {
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    if (event === 'questComplete' && sparkleRef.current) {
      sparkleRef.current.reset();
      sparkleRef.current.play();
    } else if (
      (event === 'levelUp' ||
        event === 'tierUp' ||
        event === 'evolution' ||
        event === 'contractComplete') &&
      levelUpRef.current
    ) {
      levelUpRef.current.reset();
      levelUpRef.current.play();
    }
  }, [event, eventNonce, reduceMotion]);

  const config = buildNiceAvatarConfig(appearance, dominantStat, classTier, mood, blinking);
  const moteCount = mood === 'sad' ? 4 : 5;
  const stage = size + 96;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: stage, height: stage },
        { transform: [{ translateY: anims.bounceY }, { translateX: anims.shakeX }] },
      ]}
    >
      <PulseGlow
        color={accentColor}
        intensity={classTier >= 4 ? 'strong' : classTier >= 2 ? 'medium' : 'soft'}
        active={!reduceMotion}
        style={[styles.glowFrame, { width: stage, height: stage }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backAura,
            {
              width: size + 18,
              height: size + 18,
              borderRadius: (size + 18) / 2,
              borderColor: `${accentColor}55`,
              backgroundColor: `${accentColor}14`,
              transform: [{ rotate: anims.auraRotate }, { scale: anims.auraScale }],
            },
          ]}
        />

        <LivingMotes
          color={accentColor}
          count={moteCount}
          duration={anims.orbitMs}
          orbit={size / 2 + 30}
          active={!reduceMotion}
        />

        {classTier >= 3 && !reduceMotion && (
          <AppLottie
            source={require('../../../assets/animations/aura-glow.json')}
            variant="aura"
            autoPlay
            loop
            speed={mood === 'happy' ? 0.7 : 0.5}
            style={[styles.lottieBackground, { width: size + 36, height: size + 36 }]}
          />
        )}

        <AppLottie
          ref={sparkleRef}
          source={require('../../../assets/animations/sparkle.json')}
          variant="sparkle"
          loop={false}
          autoPlay={false}
          speed={1.2}
          style={[styles.lottieOverlay, { width: size + 16, height: size + 16 }]}
        />

        <AppLottie
          ref={levelUpRef}
          source={require('../../../assets/animations/levelup.json')}
          variant="levelup"
          loop={false}
          autoPlay={false}
          speed={0.8}
          style={[styles.lottieOverlay, { width: size + 24, height: size + 24 }]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            {
              width: size + 12,
              height: size + 12,
              borderRadius: (size + 12) / 2,
              backgroundColor: accentColor,
              opacity: anims.flashOpacity,
              transform: [{ scale: anims.flashScale }],
            },
          ]}
        />

        <Animated.View
          testID="avatar-body"
          style={{
            zIndex: 3,
            transform: [
              { translateX: anims.glanceX },
              { translateY: anims.breathY },
              { rotate: anims.bodyRotate },
              { rotate: anims.reactionRotate },
              { scale: anims.breathScale },
              { scaleY: anims.blinkSquash },
              { scale: anims.punchScale },
            ],
          }}
        >
          <View
            style={[
              styles.avatarFrame,
              {
                width: size + 8,
                height: size + 8,
                borderRadius: (size + 8) / 2,
                borderColor: `${accentColor}50`,
              },
            ]}
          >
            <Avatar size={size} shape="circle" {...config} />
          </View>
        </Animated.View>
      </PulseGlow>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backAura: {
    position: 'absolute',
    borderWidth: 1,
  },
  avatarFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.veil,
    overflow: 'hidden',
  },
  flashOverlay: {
    position: 'absolute',
    zIndex: 4,
  },
  lottieBackground: {
    position: 'absolute',
    zIndex: 0,
  },
  lottieOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
});
