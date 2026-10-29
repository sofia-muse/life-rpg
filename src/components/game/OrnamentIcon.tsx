import React from 'react';
import Svg, { Path, Circle, Polygon, G } from 'react-native-svg';
import { colors } from '../../config/theme';

export type OrnamentName =
  | 'close'
  | 'check'
  | 'share'
  | 'arrow-up'
  | 'eye'
  | 'star'
  | 'tree'
  | 'shield'
  | 'circle'
  | 'diamond'
  | 'hexagon';
/** Small controls use crisp custom linework from the same gold heraldic vocabulary. */
export function OrnamentIcon({
  name,
  size = 20,
  color = colors.gold,
}: {
  name: OrnamentName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <G fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        {name === 'close' && (
          <>
            <Path d="M6 6l12 12M18 6L6 18" />
            <Circle cx={12} cy={12} r={10} opacity={0.45} />
          </>
        )}
        {name === 'check' && <Path d="M4 12l5 6L20 5M17 5h3v3" />}
        {name === 'share' && <Path d="M6 17L19 4M10 4h9v9M5 8H3v13h13v-2" />}
        {name === 'arrow-up' && <Path d="M12 21V3M5 10l7-7 7 7M5 20h14" />}
        {name === 'eye' && (
          <>
            <Path d="M2 12Q12 0 22 12Q12 24 2 12Z" />
            <Circle cx={12} cy={12} r={3} />
          </>
        )}
        {name === 'star' && <Polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" />}
        {name === 'tree' && (
          <>
            <Path d="M12 22V8M12 16l-5-4M12 12l5-4M7 21h10" />
            <Path d="M5 15C0 10 5 5 8 6C8 0 17 0 17 6C24 5 25 15 18 17M6 16h5" />
          </>
        )}
        {name === 'shield' && <Path d="M12 2l9 4v7q-1 6-9 9Q4 19 3 13V6Z" />}
        {name === 'circle' && <Circle cx={12} cy={12} r={9} />}
        {name === 'diamond' && <Polygon points="12,2 21,12 12,22 3,12" />}
        {name === 'hexagon' && <Polygon points="7,3 17,3 22,12 17,21 7,21 2,12" />}
      </G>
    </Svg>
  );
}
