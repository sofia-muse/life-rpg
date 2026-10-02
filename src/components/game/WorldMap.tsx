import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { STAT_REGIONS } from '../../config/campaignChapters';
import { colors, fontSize, radius, spacing } from '../../config/theme';
import { StatName, STAT_COLORS, STAT_NAMES } from '../../types';

const NODES: Record<StatName, { x: number; y: number }> = {
  strength: { x: 18, y: 28 },
  vitality: { x: 50, y: 14 },
  intelligence: { x: 82, y: 28 },
  charisma: { x: 18, y: 72 },
  dexterity: { x: 50, y: 86 },
  willpower: { x: 82, y: 72 },
};

const PATHS: [StatName, StatName][] = [
  ['strength', 'vitality'],
  ['vitality', 'intelligence'],
  ['strength', 'charisma'],
  ['intelligence', 'willpower'],
  ['charisma', 'dexterity'],
  ['dexterity', 'willpower'],
  ['vitality', 'dexterity'],
];

interface Props {
  dominantStat: StatName;
  stats: Record<StatName, number>;
  bossCounts: Partial<Record<StatName, number>>;
  selected: StatName | null;
  onSelect: (stat: StatName) => void;
  onArrived: (stat: StatName) => void;
}

export function WorldMap({ dominantStat, stats, bossCounts, selected, onSelect, onArrived }: Props) {
  const [marker, setMarker] = useState<{ stat: StatName; heroStat: StatName } | null>(null);
  const position = marker && marker.heroStat === dominantStat ? marker.stat : dominantStat;
  const progress = useRef(new Animated.Value(1)).current;
  const [travel, setTravel] = useState<{ from: StatName; to: StatName } | null>(null);
  const arrivedRef = useRef(onArrived);
  arrivedRef.current = onArrived;

  useEffect(() => {
    if (!travel) return undefined;
    const destination = travel.to;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      setMarker({ stat: destination, heroStat: dominantStat });
      setTravel(null);
      arrivedRef.current(destination);
    });
    return () => animation.stop();
  }, [dominantStat, progress, travel]);

  const beginTravel = (stat: StatName) => {
    if (travel) return;
    onSelect(stat);
    if (stat === position) {
      onArrived(stat);
      return;
    }
    progress.setValue(0);
    setTravel({ from: position, to: stat });
  };

  const from = NODES[travel?.from ?? position];
  const to = NODES[travel?.to ?? position];
  const left = progress.interpolate({ inputRange: [0, 1], outputRange: [`${from.x}%`, `${to.x}%`] });
  const top = progress.interpolate({ inputRange: [0, 1], outputRange: [`${from.y}%`, `${to.y}%`] });

  return (
    <View style={styles.map}>
      <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        {PATHS.map(([a, b]) => (
          <Line
            key={`${a}-${b}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke={colors.borderStrong}
            strokeWidth={0.7}
          />
        ))}
      </Svg>

      {STAT_NAMES.map((stat) => {
        const region = STAT_REGIONS.find((entry) => entry.stat === stat);
        if (!region) return null;
        return (
          <RegionNode
            key={stat}
            stat={stat}
            label={region.label}
            icon={region.icon}
            level={stats[stat] ?? 1}
            active={stat === dominantStat || stat === selected}
            bosses={bossCounts[stat] ?? 0}
            onPress={() => beginTravel(stat)}
          />
        );
      })}

      <Animated.View pointerEvents="none" style={[styles.hero, { left, top }]}>
        <Text style={styles.heroMark}>✦</Text>
      </Animated.View>
    </View>
  );
}

function RegionNode({
  stat,
  label,
  icon,
  level,
  active,
  bosses,
  onPress,
}: {
  stat: StatName;
  label: string;
  icon: string;
  level: number;
  active: boolean;
  bosses: number;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const brightness = Math.min(level / 20, 1);

  useEffect(() => {
    if (!active) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, pulse]);

  return (
    <TouchableOpacity
      style={[
        styles.node,
        {
          left: `${NODES[stat].x}%`,
          top: `${NODES[stat].y}%`,
          borderColor: STAT_COLORS[stat],
          opacity: 0.55 + brightness * 0.45,
        },
        active && styles.nodeActive,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {active ? (
        <Animated.View style={[styles.pulse, { borderColor: STAT_COLORS[stat], opacity: pulse }]} />
      ) : null}
      <Text style={styles.nodeIcon}>{icon}</Text>
      <Text style={styles.nodeLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.nodeLevel, { color: STAT_COLORS[stat] }]}>Lv.{level}</Text>
      {bosses > 0 ? <Text style={styles.dungeon}>🐉 {bosses}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 360,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgInset,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    width: 108,
    marginLeft: -54,
    marginTop: -36,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: 'rgba(15, 15, 26, 0.88)',
  },
  nodeActive: {
    backgroundColor: colors.bgCardRaised,
  },
  pulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    bottom: -4,
    left: -4,
    borderRadius: radius.md,
    borderWidth: 1,
    opacity: 0.7,
  },
  nodeIcon: { fontSize: 18 },
  nodeLabel: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  nodeLevel: { fontSize: fontSize.xs, fontWeight: '800' },
  dungeon: { fontSize: 10, color: colors.warning, marginTop: 2 },
  hero: {
    position: 'absolute',
    marginLeft: -8,
    marginTop: -46,
  },
  heroMark: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '900',
  },
});
