import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Hero, StatName, STAT_COLORS } from '../../types';
import { CREST_SHAPES, SIGILS, getStatPipPositions, TIER_FRAMES } from './crestPaths';
import { StatRadar } from './StatRadar';
import { ACCENT_COLORS, STAT_PIP_THRESHOLDS } from '../../config/appearanceConfig';
import { colors, fontSize } from '../../config/theme';
import { levelFromXP } from '../../config/xpTables';

interface Props {
  hero: Hero;
  size?: number;
  onPress?: () => void;
  showTitle?: boolean;
}

const AnimatedSvg = Animated.createAnimatedComponent(View);

export function HeroCrest({ hero, size = 120, onPress, showTitle }: Props) {
  const appearance = hero.appearance;
  const tierFrame = TIER_FRAMES[hero.classTier] || TIER_FRAMES[1];

  // Resolve accent color
  let accentColor: string;
  if (!appearance || appearance.accentOverride === 'none') {
    accentColor = STAT_COLORS[hero.dominantStat];
  } else {
    accentColor = ACCENT_COLORS[appearance.accentOverride] || STAT_COLORS[hero.dominantStat];
  }

  const crestShape = appearance?.crestShape || 'shield';
  const sigil = appearance?.sigil || 'sword';
  const shouldShowTitle = showTitle ?? appearance?.titleDisplay ?? true;

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(tierFrame.glowIntensity * 0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowOpacity, {
            toValue: tierFrame.glowIntensity,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowOpacity, {
            toValue: tierFrame.glowIntensity * 0.5,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [hero.classTier]);

  // Stat levels for pip rendering
  const statLevels: Record<StatName, number> = {
    strength: levelFromXP(hero.statXP.strength),
    vitality: levelFromXP(hero.statXP.vitality),
    intelligence: levelFromXP(hero.statXP.intelligence),
    charisma: levelFromXP(hero.statXP.charisma),
    dexterity: levelFromXP(hero.statXP.dexterity),
    willpower: levelFromXP(hero.statXP.willpower),
  };

  const pipPositions = getStatPipPositions(size);
  const svgSize = size;

  const content = (
    <View
      style={[styles.wrapper, { width: size + 24, height: size + (shouldShowTitle ? 30 : 12) }]}
    >
      {/* Glow background */}
      <AnimatedSvg
        style={[
          styles.glow,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: size / 2,
            backgroundColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      {/* Outer ring for tier 3+ */}
      {tierFrame.outerRing && (
        <View
          style={[
            styles.outerRing,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: size / 2 + 10,
              borderColor: `${accentColor}40`,
            },
          ]}
        />
      )}

      {/* Main crest SVG */}
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="crestGrad" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
            </RadialGradient>
          </Defs>

          {/* Shape fill */}
          <Path
            d={CREST_SHAPES[crestShape]}
            fill="url(#crestGrad)"
            stroke={accentColor}
            strokeWidth={tierFrame.strokeWidth}
            strokeDasharray={tierFrame.dashArray}
            strokeLinejoin="round"
          />

          {/* Sigil */}
          <Path
            d={SIGILS[sigil]}
            fill="none"
            stroke={accentColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        </Svg>
      </Animated.View>

      {/* Stat radar watermark overlay */}
      <View style={[styles.radarOverlay, { width: svgSize * 0.7, height: svgSize * 0.7 }]}>
        <StatRadar stats={hero.stats} size={svgSize * 0.7} opacity={0.25} />
      </View>

      {/* Stat pips */}
      {(
        ['strength', 'vitality', 'intelligence', 'charisma', 'dexterity', 'willpower'] as StatName[]
      ).map((stat) => {
        const level = statLevels[stat];
        if (level < STAT_PIP_THRESHOLDS.dot) return null;

        const pos = pipPositions[stat];
        const pipSize =
          level >= STAT_PIP_THRESHOLDS.glow ? 8 : level >= STAT_PIP_THRESHOLDS.rune ? 6 : 4;
        const pipOpacity =
          level >= STAT_PIP_THRESHOLDS.glow ? 1 : level >= STAT_PIP_THRESHOLDS.rune ? 0.8 : 0.5;

        return (
          <View
            key={stat}
            style={[
              styles.pip,
              {
                left: pos.x - pipSize / 2 + 12, // offset for wrapper padding
                top: pos.y - pipSize / 2 + 6,
                width: pipSize,
                height: pipSize,
                borderRadius: pipSize / 2,
                backgroundColor: STAT_COLORS[stat],
                opacity: pipOpacity,
                shadowColor: STAT_COLORS[stat],
                shadowRadius: level >= STAT_PIP_THRESHOLDS.glow ? 6 : 0,
                shadowOpacity: level >= STAT_PIP_THRESHOLDS.glow ? 0.8 : 0,
              },
            ]}
          />
        );
      })}

      {/* Edit hint */}
      {onPress && (
        <View style={styles.editHint}>
          <Text style={styles.editHintText}>✎</Text>
        </View>
      )}

      {/* Class title */}
      {shouldShowTitle && (
        <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>
          {hero.className}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  radarOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pip: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
  },
  editHint: {
    position: 'absolute',
    bottom: 18,
    right: 0,
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editHintText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});
