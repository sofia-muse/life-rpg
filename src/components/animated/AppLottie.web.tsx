import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppLottieHandle, AppLottieProps } from './AppLottie.types';
import { colors } from '../../config/theme';

const AppLottie = React.forwardRef<AppLottieHandle, AppLottieProps>(
  ({ autoPlay = false, loop = false, style }, ref) => {
    const pulse = useRef(new Animated.Value(autoPlay ? 0.28 : 0)).current;
    const burst = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!autoPlay) return undefined;

      const baseAnimation = Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.48,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.18,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]);
      const animation = loop ? Animated.loop(baseAnimation) : baseAnimation;

      animation.start();
      return () => animation.stop();
    }, [autoPlay, loop, pulse]);

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          burst.setValue(0.9);
          Animated.sequence([
            Animated.timing(burst, { toValue: 0.3, duration: 180, useNativeDriver: true }),
            Animated.timing(burst, { toValue: 0, duration: 520, useNativeDriver: true }),
          ]).start();
        },
        reset: () => {
          burst.stopAnimation();
          burst.setValue(0);
        },
      }),
      [burst],
    );

    return (
      <View pointerEvents="none" style={style}>
        <Animated.View
          style={[
            styles.pulse,
            {
              opacity: pulse,
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.14] }) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.burst,
            {
              opacity: burst,
              transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.28] }) }],
            },
          ]}
        />
      </View>
    );
  },
);

AppLottie.displayName = 'AppLottie';

export default AppLottie;

const styles = StyleSheet.create({
  pulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: colors.goldSoft,
  },
  burst: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.goldBright,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
