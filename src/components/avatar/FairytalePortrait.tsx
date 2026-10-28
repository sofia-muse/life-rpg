import React, { useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Ellipse, G } from 'react-native-svg';
import { CharacterAppearance, ClassTier, StatName } from '../../types';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from '../../config/appearanceConfig';

interface Props {
  appearance: CharacterAppearance;
  dominantStat: StatName;
  classTier: ClassTier;
  size: number;
}
const CLOAKS: Record<StatName, [string, string]> = {
  strength: ['#7B5541', '#302D26'],
  vitality: ['#4F8062', '#163E32'],
  intelligence: ['#4B747E', '#193644'],
  charisma: ['#947A4A', '#463C2B'],
  dexterity: ['#5C7761', '#233F34'],
  willpower: ['#766584', '#36304D'],
};

/** Scalable storybook portrait. All saved appearance choices remain visible. */
export function FairytalePortrait({ appearance, dominantStat, classTier, size }: Props) {
  const id = useId().replace(/:/g, '');
  const skin = SKIN_TONE_COLORS[appearance.skinTone] ?? SKIN_TONE_COLORS[2];
  const hair = HAIR_COLOR_VALUES[appearance.hairColor] ?? HAIR_COLOR_VALUES[1];
  const [light, dark] = CLOAKS[dominantStat];
  const long = appearance.hairStyle === 'long' || appearance.hairStyle === 'medium';
  const female = appearance.gender === 'female';
  const flair = appearance.classFlair ?? 'auto';
  const smiling = appearance.eyeStyle === 'smile';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 240 260"
      accessibilityLabel="Your enchanted forest hero"
    >
      <Defs>
        <LinearGradient id={`${id}cloak`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </LinearGradient>
        <LinearGradient id={`${id}skin`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={skin} />
          <Stop offset="1" stopColor={skin} stopOpacity="0.78" />
        </LinearGradient>
      </Defs>
      <Circle cx="120" cy="116" r="96" fill="#102C25" />
      <Circle
        cx="120"
        cy="116"
        r="91"
        fill="none"
        stroke="#D5BB7B"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <Path
        d="M39 150 Q7 98 45 53 M201 150 Q233 98 195 53"
        stroke="#8FA887"
        fill="none"
        strokeWidth="2"
      />
      <Path
        d="M34 124 Q13 112 24 96 Q41 104 34 124 M31 95 Q17 74 33 66 Q46 83 31 95 M206 124 Q227 112 216 96 Q199 104 206 124 M209 95 Q223 74 207 66 Q194 83 209 95"
        fill="#6F8E6C"
      />
      {long && <Path d="M67 91 Q50 138 55 204 L83 220 L174 218 Q192 172 175 88Z" fill={hair} />}
      <Path
        d="M21 260 Q27 194 77 187 L105 175 L135 175 L163 187 Q213 194 219 260Z"
        fill={`url(#${id}cloak)`}
      />
      <Path d="M89 185 L120 225 L151 185 L143 260 L97 260Z" fill="#E8DEBC" />
      <Path d="M97 155 L96 185 Q120 209 145 185 L141 155Z" fill={skin} />
      <Path
        d="M74 194 L98 211 L80 250 M166 194 L142 211 L160 250"
        fill="none"
        stroke="#C4AE75"
        strokeWidth="2"
      />
      <Path
        d="M75 213 Q48 212 42 243 M165 213 Q192 212 198 243"
        fill="none"
        stroke="#97A07A"
        strokeWidth="1.5"
      />
      <Path
        d="M48 232 Q54 218 66 223 Q63 236 48 232 M192 232 Q186 218 174 223 Q177 236 192 232"
        fill="#84916E"
      />
      <Path
        d="M75 110 L46 91 Q46 123 76 136 M165 110 L194 91 Q194 123 164 136"
        fill={skin}
        stroke="#A27957"
        strokeWidth="1"
      />
      <Path
        d={
          female
            ? 'M75 83 Q120 47 165 83 L163 131 Q157 168 120 181 Q83 167 77 131Z'
            : 'M74 82 Q120 48 166 82 L163 138 L146 166 L132 181 L108 181 L92 166 L77 138Z'
        }
        fill={`url(#${id}skin)`}
      />
      <Path
        d="M83 111 Q95 105 107 111 M133 111 Q145 105 157 111"
        fill="none"
        stroke={hair}
        strokeWidth={female ? 2 : 3}
        strokeLinecap="round"
      />
      {smiling ? (
        <Path
          d="M87 123 Q97 114 106 123 M134 123 Q143 114 153 123"
          stroke="#302F2B"
          strokeWidth="2.5"
          fill="none"
        />
      ) : (
        <G>
          <Ellipse
            cx="98"
            cy="123"
            rx="10"
            ry={appearance.eyeStyle === 'circle' ? 6 : 4.5}
            fill="#F4EEDC"
          />
          <Ellipse
            cx="143"
            cy="123"
            rx="10"
            ry={appearance.eyeStyle === 'circle' ? 6 : 4.5}
            fill="#F4EEDC"
          />
          <Circle cx="99" cy="123" r="4" fill="#4C6958" />
          <Circle cx="142" cy="123" r="4" fill="#4C6958" />
          <Circle cx="99" cy="123" r="2" fill="#16271E" />
          <Circle cx="142" cy="123" r="2" fill="#16271E" />
          <Circle cx="100" cy="122" r="1" fill="#FFF" />
          <Circle cx="143" cy="122" r="1" fill="#FFF" />
        </G>
      )}
      <Path
        d="M119 125 L115 140 Q120 144 126 140"
        fill="none"
        stroke="#9F7354"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d={
          appearance.mouthStyle === 'peace'
            ? 'M109 155 Q120 157 131 155'
            : appearance.mouthStyle === 'laugh'
              ? 'M107 151 Q120 174 133 151Z'
              : 'M108 153 Q120 164 132 153'
        }
        fill={appearance.mouthStyle === 'laugh' ? '#7E4C42' : 'none'}
        stroke="#895344"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {appearance.hairStyle !== 'shaved' && (
        <G>
          <Path
            d="M69 108 Q51 56 89 45 Q133 25 166 60 Q184 79 170 115 L158 89 Q126 91 104 67 Q95 96 69 108Z"
            fill={hair}
          />
          <Path
            d="M82 76 Q108 39 148 61 M72 94 Q91 85 99 69"
            stroke="#D7BC88"
            strokeOpacity="0.35"
            fill="none"
            strokeWidth="2"
          />
          {long && (
            <Path
              d="M72 96 Q53 143 73 190 M166 95 Q188 150 168 193"
              stroke={hair}
              strokeWidth={appearance.hairStyle === 'long' ? 16 : 9}
              fill="none"
            />
          )}
        </G>
      )}
      <Path d="M71 89 Q121 64 169 89" fill="none" stroke="#DCC68C" strokeWidth="3" />
      <Path d="M87 83 Q82 69 95 72 L102 79 M153 83 Q158 69 145 72 L138 79" fill="#B7BD8C" />
      <Path
        d="M120 72 L126 82 L120 93 L114 82Z"
        fill={classTier >= 3 ? '#BDE8D7' : '#E8D69A'}
        stroke="#F0E4BA"
      />
      {(classTier >= 2 || flair === 'circlet') && (
        <Path
          d="M100 77 L97 66 L110 75 M140 77 L143 66 L130 75"
          fill="none"
          stroke="#DCC68C"
          strokeWidth="2"
        />
      )}
      {flair === 'pauldrons' && (
        <G fill="#7A8671" stroke="#D5BB7B" strokeWidth="1.5">
          <Path d="M28 222 Q43 193 75 192 L89 218 L64 235Z" />
          <Path d="M212 222 Q197 193 165 192 L151 218 L176 235Z" />
        </G>
      )}
      {flair === 'mantle' && (
        <Path
          d="M76 188 Q120 219 164 188 L155 211 Q120 233 85 211Z"
          fill={light}
          stroke="#D5BB7B"
          strokeWidth="2"
        />
      )}
      {appearance.glassesStyle !== 'none' && (
        <G stroke="#D7BE80" strokeWidth="2" fill="none">
          {appearance.glassesStyle === 'round' ? (
            <G>
              <Circle cx="98" cy="123" r="14" />
              <Circle cx="143" cy="123" r="14" />
            </G>
          ) : (
            <Path d="M83 111 H112 V134 H83Z M129 111 H158 V134 H129Z" />
          )}
          <Path d="M112 122 Q120 117 129 122" />
        </G>
      )}
      <Path d="M120 214 L127 224 L120 236 L113 224Z" fill="#D5BB7B" />
      <Circle cx="120" cy="224" r="3" fill={light} />
      <Path
        d="M33 47 L36 39 L39 47 L47 50 L39 53 L36 61 L33 53 L25 50Z M199 171 L201 165 L203 171 L209 173 L203 175 L201 181 L199 175 L193 173Z"
        fill="#E7D699"
      />
    </Svg>
  );
}
