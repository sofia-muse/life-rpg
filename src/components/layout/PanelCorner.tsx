import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function PanelCorner() {
  return (
    <Svg width={24} height={24} viewBox="0 0 32 32">
      <Path
        d="M3 29V9Q3 3 9 3H29 M8 26V12Q8 8 12 8H26 M5 20Q17 18 19 6 M9 14Q6 8 13 9 Q17 15 9 14 M14 10Q11 4 18 5Q22 11 14 10"
        fill="none"
        stroke="#C7AB6D"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </Svg>
  );
}
