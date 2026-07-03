import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Avatar from '@zamplyy/react-native-nice-avatar';
import { CharacterAppearance, StatName, ClassTier } from '../../types';
import { buildNiceAvatarConfig } from '../../config/anime/niceAvatarConfig';
import { useCharacterAnimations } from './anime/useCharacterAnimations';
import { useExpressionState, CharacterEvent } from './anime/useExpressionState';
import { useHeroStore } from '../../store/heroStore';
import AppLottie from '../animated/AppLottie';
import { AppLottieHandle } from '../animated/AppLottie.types';

interface Props {
  appearance: CharacterAppearance;
  dominantStat: StatName;
  classTier: ClassTier;
  size?: number;
  event?: CharacterEvent;
}

export function NiceAvatarCharacter({
  appearance,
  dominantStat,
  classTier,
  size = 80,
  event = 'idle',
}: Props) {
  const hero = useHeroStore((s) => s.hero);
  const { mood } = useExpressionState(hero);
  const anims = useCharacterAnimations(event);

  const sparkleRef = useRef<AppLottieHandle>(null);
  const levelUpRef = useRef<AppLottieHandle>(null);

  useEffect(() => {
    if (event === 'questComplete' && sparkleRef.current) {
      sparkleRef.current.reset();
      sparkleRef.current.play();
    } else if (event === 'levelUp' && levelUpRef.current) {
      levelUpRef.current.reset();
      levelUpRef.current.play();
    }
  }, [event]);

  const config = buildNiceAvatarConfig(appearance, dominantStat, classTier, mood);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size + 20, height: size + 20 },
        { transform: [{ translateY: anims.bounceY }] },
      ]}
    >
      {/* Lottie: Aura glow for tier 3+ */}
      {classTier >= 3 && (
        <AppLottie
          source={require('../../../assets/animations/aura-glow.json')}
          autoPlay
          loop
          speed={0.5}
          style={[styles.lottieBackground, { width: size + 30, height: size + 30 }]}
        />
      )}

      {/* Lottie: Sparkle (quest complete) */}
      <AppLottie
        ref={sparkleRef}
        source={require('../../../assets/animations/sparkle.json')}
        loop={false}
        autoPlay={false}
        speed={1.2}
        style={[styles.lottieOverlay, { width: size + 10, height: size + 10 }]}
      />

      {/* Lottie: Level up burst */}
      <AppLottie
        ref={levelUpRef}
        source={require('../../../assets/animations/levelup.json')}
        loop={false}
        autoPlay={false}
        speed={0.8}
        style={[styles.lottieOverlay, { width: size + 20, height: size + 20 }]}
      />

      {/* Nice Avatar with breathing animation */}
      <Animated.View style={{ transform: [{ translateY: anims.breathY }] }}>
        <Avatar size={size} shape="circle" {...config} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieBackground: {
    position: 'absolute',
    zIndex: -1,
  },
  lottieOverlay: {
    position: 'absolute',
    zIndex: 10,
    pointerEvents: 'none',
  },
});
