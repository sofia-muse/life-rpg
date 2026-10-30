import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function PanelCorner({ size = 32, color = '#C7AB6D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Path
        d="M2 37V10Q2 2 10 2H37 M7 32V13Q7 7 13 7H32 M4 29Q22 24 27 4 M10 25Q7 16 16 17Q20 25 10 25 M17 17Q14 9 23 10Q27 18 17 17 M27 4L30 7L27 10L24 7Z M4 34L7 37L10 34L7 31Z"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </Svg>
  );
}
