import React from 'react';
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from 'react-native';
import { StatName } from '../../types';

export type RPGIconName =
  | StatName
  | 'shield'
  | 'dragon'
  | 'trophy'
  | 'gift'
  | 'scroll'
  | 'hammer'
  | 'settings'
  | 'flame'
  | 'lock'
  | 'crown'
  | 'map'
  | 'crystal';
const ATTRIBUTES = require('../../../assets/storybook/attributes-v2.webp');
const ADVENTURE = require('../../../assets/storybook/adventure-v2.webp');
const RITUALS = require('../../../assets/storybook/rituals-v2.webp');
const SPRITES: Record<RPGIconName, [ImageSourcePropType, number, number]> = {
  strength: [ATTRIBUTES, 0, 0],
  vitality: [ATTRIBUTES, 1, 0],
  intelligence: [ATTRIBUTES, 2, 0],
  charisma: [ATTRIBUTES, 0, 1],
  dexterity: [ATTRIBUTES, 1, 1],
  willpower: [ATTRIBUTES, 2, 1],
  shield: [ADVENTURE, 0, 0],
  dragon: [ADVENTURE, 1, 0],
  trophy: [ADVENTURE, 2, 0],
  gift: [ADVENTURE, 0, 1],
  scroll: [ADVENTURE, 1, 1],
  hammer: [ADVENTURE, 2, 1],
  settings: [RITUALS, 0, 0],
  flame: [RITUALS, 1, 0],
  lock: [RITUALS, 2, 0],
  crown: [RITUALS, 0, 1],
  map: [RITUALS, 1, 1],
  crystal: [RITUALS, 2, 1],
};

/** Named local sprites; control labels remain separate from decorative art. */
export function RPGIcon({
  name,
  size = 32,
  style,
  label,
}: {
  name: RPGIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const [source, column, row] = SPRITES[name];
  return (
    <View
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      pointerEvents="none"
      style={[
        { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', flexShrink: 0 },
        style,
      ]}
    >
      <Image
        accessible={false}
        source={source}
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

const LEGACY: Record<string, RPGIconName> = {
  '⚔️': 'strength',
  '⚔': 'strength',
  '🗡️': 'strength',
  '💪': 'strength',
  '🪓': 'strength',
  '❤️': 'vitality',
  '🌳': 'vitality',
  '📚': 'intelligence',
  '✨': 'crystal',
  '🔮': 'crystal',
  '✦': 'crystal',
  '⚡': 'crystal',
  '💎': 'crystal',
  '💫': 'crystal',
  '🌟': 'crystal',
  '⭐': 'crystal',
  '🌙': 'intelligence',
  '☀️': 'charisma',
  '🏃': 'dexterity',
  '🔥': 'flame',
  '🏆': 'trophy',
  '🏅': 'trophy',
  '👑': 'crown',
  '🛡️': 'shield',
  '🐉': 'dragon',
  '📜': 'scroll',
  '📅': 'scroll',
  '🔨': 'hammer',
  '🏛️': 'shield',
  '⚖️': 'charisma',
  '🔒': 'lock',
  '🎁': 'gift',
  '🗺️': 'map',
};
export function LegacyRPGIcon({ symbol, size = 32 }: { symbol: string; size?: number }) {
  return <RPGIcon name={LEGACY[symbol] ?? 'crystal'} size={size} />;
}
