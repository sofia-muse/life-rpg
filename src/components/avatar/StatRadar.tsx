import React from 'react';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { StatBlock, StatName, STAT_COLORS } from '../../types';

interface Props {
  stats: StatBlock;
  size: number;
  opacity?: number;
  showLabels?: boolean;
  maxLevel?: number;
}

const STAT_ORDER: StatName[] = [
  'strength',
  'vitality',
  'intelligence',
  'charisma',
  'dexterity',
  'willpower',
];

function getHexPoint(cx: number, cy: number, r: number, index: number): { x: number; y: number } {
  const angle = (index * 60 - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function StatRadar({
  stats,
  size,
  opacity = 0.6,
  showLabels = false,
  maxLevel = 20,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = showLabels ? size * 0.35 : size * 0.42;
  const labelR = size * 0.47;

  // Background hex grid (3 rings)
  const gridRings = [0.33, 0.66, 1].map((scale) => {
    const points = STAT_ORDER.map((_, i) => {
      const p = getHexPoint(cx, cy, r * scale, i);
      return `${p.x},${p.y}`;
    }).join(' ');
    return points;
  });

  // Axis lines
  const axes = STAT_ORDER.map((_, i) => getHexPoint(cx, cy, r, i));

  // Stat polygon
  const statPoints = STAT_ORDER.map((stat, i) => {
    const level = Math.min(stats[stat], maxLevel);
    const pct = level / maxLevel;
    const p = getHexPoint(cx, cy, r * Math.max(pct, 0.05), i);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Vertex dots colored by stat
  const vertices = STAT_ORDER.map((stat, i) => {
    const level = Math.min(stats[stat], maxLevel);
    const pct = level / maxLevel;
    const p = getHexPoint(cx, cy, r * Math.max(pct, 0.05), i);
    return { ...p, stat, color: STAT_COLORS[stat] };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridRings.map((points, i) => (
        <Polygon
          key={`grid-${i}`}
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axes.map((p, i) => (
        <Line
          key={`axis-${i}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      ))}

      {/* Stat fill polygon */}
      <Polygon
        points={statPoints}
        fill={`rgba(196, 169, 98, ${opacity * 0.3})`}
        stroke={`rgba(196, 169, 98, ${opacity})`}
        strokeWidth={1.5}
      />

      {/* Stat vertex dots */}
      {vertices.map((v) => (
        <Circle key={v.stat} cx={v.x} cy={v.y} r={2.5} fill={v.color} opacity={opacity} />
      ))}

      {/* Labels */}
      {showLabels &&
        STAT_ORDER.map((stat, i) => {
          const p = getHexPoint(cx, cy, labelR, i);
          return (
            <SvgText
              key={`label-${stat}`}
              x={p.x}
              y={p.y}
              fill={STAT_COLORS[stat]}
              fontSize={size * 0.06}
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {stat.slice(0, 3).toUpperCase()}
            </SvgText>
          );
        })}
    </Svg>
  );
}
