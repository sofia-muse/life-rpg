import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { fontSize } from '../../config/theme';
import { useUIStore } from '../../store/uiStore';

function Floater({
  id,
  label,
  color,
  index,
}: {
  id: string;
  label: string;
  color: string;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const dismissFloater = useUIStore((s) => s.dismissFloater);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -48 - index * 8, duration: 380, useNativeDriver: true }),
      ]),
    ]);
    animation.start(({ finished }) => {
      if (finished) dismissFloater(id);
    });
    return () => animation.stop();
  }, [dismissFloater, id, index, opacity, translateY]);

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          color,
          marginTop: index === 0 ? 0 : 4,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {label}
    </Animated.Text>
  );
}

export function CombatTextLayer() {
  const floaters = useUIStore((s) => s.combatFloaters);
  if (floaters.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {floaters.map((floater, index) => (
        <Floater
          key={floater.id}
          id={floater.id}
          label={floater.label}
          color={floater.color}
          index={index}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  text: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
