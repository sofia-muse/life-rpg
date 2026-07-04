import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Avatar from '@zamplyy/react-native-nice-avatar';
import { CharacterAppearance, ClassTier, StatName, STAT_COLORS } from '../../types';
import { buildNiceAvatarConfig } from '../../config/anime/niceAvatarConfig';
import { useCharacterAnimations } from './anime/useCharacterAnimations';
import { useExpressionState, CharacterEvent } from './anime/useExpressionState';
import { useHeroStore } from '../../store/heroStore';
import AppLottie from '../animated/AppLottie';
import { AppLottieHandle } from '../animated/AppLottie.types';
import { PulseGlow } from '../animated/PulseGlow';
import { colors } from '../../config/theme';

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
  const accentColor = STAT_COLORS[dominantStat];

  const sparkleRef = useRef<AppLottieHandle>(null);
  const levelUpRef = useRef<AppLottieHandle>(null);

  useEffect(() => {
    if (event === 'questComplete' && sparkleRef.current) {
      sparkleRef.current.reset();
      sparkleRef.current.play();
    } else if ((event === 'levelUp' || event === 'tierUp') && levelUpRef.current) {
      levelUpRef.current.reset();
      levelUpRef.current.play();
    }
  }, [event]);

  const config = buildNiceAvatarConfig(appearance, dominantStat, classTier, mood);
  const flashScale = anims.flashOpacity.interpolate({
    inputRange: [0, 0.7],
    outputRange: [0.96, 1.16],
  });
  const auraScale = anims.breathY.interpolate({
    inputRange: [-1.5, 0],
    outputRange: [1.04, 0.98],
  });
  const tiltScale = anims.flashOpacity.interpolate({
    inputRange: [0, 0.7],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size + 20, height: size + 20 },
        { transform: [{ translateY: anims.bounceY }] },
      ]}
    >
      <PulseGlow
        color={accentColor}
        intensity={classTier >= 4 ? 'strong' : classTier >= 2 ? 'medium' : 'soft'}
        style={[styles.glowFrame, { width: size + 28, height: size + 28 }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backAura,
            {
              width: size + 18,
              height: size + 18,
              borderRadius: (size + 18) / 2,
              borderColor: `${accentColor}35`,
              backgroundColor: `${accentColor}12`,
              transform: [{ rotate: anims.hairBackRotate }, { scale: auraScale }],
            },
          ]}
        />

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
              transform: [{ scale: flashScale }],
            },
          ]}
        />

        {/* Nice Avatar with breathing animation */}
        <Animated.View
          style={{
            transform: [
              { translateY: anims.breathY },
              { rotate: anims.hairFrontRotate },
              { scale: tiltScale },
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
    zIndex: -1,
  },
  lottieOverlay: {
    position: 'absolute',
    zIndex: 10,
    pointerEvents: 'none',
  },
});
