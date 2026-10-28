import React from 'react';
import { Image, View } from 'react-native';
import { StatName } from '../../types';
const POSITION: Record<StatName, [number, number]> = {
  strength: [0, 0],
  vitality: [1, 0],
  intelligence: [2, 0],
  charisma: [0, 1],
  dexterity: [1, 1],
  willpower: [2, 1],
};
/** The atlas is displayed as six independently framed sprites, without scaling the layout. */
export function FantasyIcon({ stat, size = 32 }: { stat: StatName; size?: number }) {
  const [column, row] = POSITION[stat];
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Image
        source={require('../../../assets/storybook/attribute-icons.webp')}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: size * 3,
          height: size * 2,
          left: -column * size,
          top: -row * size,
        }}
      />
    </View>
  );
}
