import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';
import { Hero, StatName, STAT_COLORS } from '../../types';
import { CREST_SHAPES, SIGILS, getStatPipPositions, TIER_FRAMES } from './crestPaths';
import { StatRadar } from './StatRadar';
import { ACCENT_COLORS, STAT_PIP_THRESHOLDS } from '../../config/appearanceConfig';
import { colors, fontSize } from '../../config/theme';
import { getStatLevels } from '../../engine/statEngine';
import { useSettingsStore } from '../../store/settingsStore';
import { getActiveWeeklyPath } from '../../config/weeklyPaths';

interface Props {
  hero: Hero;
  size?: number;
  onPress?: () => void;
  showTitle?: boolean;
  variant?: 'default' | 'heroic' | 'editor' | 'compact';
}

const AnimatedSvg = Animated.createAnimatedComponent(View);

export function HeroCrest({
  hero,
  size = 120,
  onPress,
  showTitle,
  variant = 'default',
}: Props) {
  const appearance = hero.appearance;
  const weeklySettings = useSettingsStore(
    useShallow((s) => ({
      weeklyPath: s.weeklyPath,
      weeklyPathWeekKey: s.weeklyPathWeekKey,
      weeklyPathStartedAt: s.weeklyPathStartedAt,
      weeklyRewardWeekKey: s.weeklyRewardWeekKey,
      weeklyRewardTitle: s.weeklyRewardTitle,
      weeklyRewardBadge: s.weeklyRewardBadge,
    })),
  );
  const activeWeeklyPath = getActiveWeeklyPath(weeklySettings);
  const tierFrame = TIER_FRAMES[hero.classTier] || TIER_FRAMES[1];
  const glowBoost = variant === 'heroic' ? 1.55 : variant === 'editor' ? 1.3 : variant === 'compact' ? 0.9 : 1;
  const particleCount =
    tierFrame.particleCount + (variant === 'heroic' ? 6 : variant === 'editor' ? 4 : 0);

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
  const glowOpacity = useRef(new Animated.Value(tierFrame.glowIntensity * 0.45 * glowBoost)).current;
  const orbitRotate = useRef(new Animated.Value(0)).current;
  const sigilFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowOpacity, {
            toValue: tierFrame.glowIntensity * glowBoost,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowOpacity, {
            toValue: tierFrame.glowIntensity * 0.45 * glowBoost,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    const orbit = Animated.loop(
      Animated.timing(orbitRotate, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: true,
      }),
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(sigilFloat, { toValue: -2, duration: 2200, useNativeDriver: true }),
        Animated.timing(sigilFloat, { toValue: 2, duration: 2200, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    orbit.start();
    float.start();
    return () => {
      pulse.stop();
      orbit.stop();
      float.stop();
    };
  }, [glowBoost, hero.classTier, glowOpacity, orbitRotate, pulseScale, sigilFloat, tierFrame.glowIntensity]);

  // Stat levels for pip rendering
  const statLevels: Record<StatName, number> = useMemo(
    () => getStatLevels(hero.statXP),
    [hero.statXP],
  );

  const pipPositions = getStatPipPositions(size);
  const svgSize = size;
  const orbitRotation = orbitRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View
      style={[styles.wrapper, { width: size + 24, height: size + (shouldShowTitle ? 30 : 12) }]}
    >
      {/* Glow background */}
      <AnimatedSvg
        style={[
          styles.glow,
          {
            width: size + 18,
            height: size + 18,
            borderRadius: size / 2,
            backgroundColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      {/* Outer ring for tier 3+ */}
      {tierFrame.outerRing && (
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: size + (variant === 'heroic' ? 30 : 20),
              height: size + (variant === 'heroic' ? 30 : 20),
              borderRadius: size / 2 + 10,
              borderColor: `${accentColor}40`,
              transform: [{ rotate: orbitRotation }],
            },
          ]}
        />
      )}

      {particleCount > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.particleOrbit,
            {
              width: size + 40,
              height: size + 40,
              transform: [{ rotate: orbitRotation }],
            },
          ]}
        >
          {Array.from({ length: particleCount }).map((_, index) => {
            const angle = (Math.PI * 2 * index) / particleCount;
            const radius = size * 0.55 + (index % 2 === 0 ? 10 : 0);
            const particleSize = index % 3 === 0 ? 5 : 3;
            return (
              <View
                key={`particle-${index}`}
                style={[
                  styles.particle,
                  {
                    left: size / 2 + 20 + Math.cos(angle) * radius - particleSize / 2,
                    top: size / 2 + 20 + Math.sin(angle) * radius - particleSize / 2,
                    width: particleSize,
                    height: particleSize,
                    borderRadius: particleSize / 2,
                    backgroundColor: index % 3 === 0 ? colors.goldBright : accentColor,
                    opacity: index % 3 === 0 ? 0.9 : 0.55,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      )}

      {tierFrame.cornerDecoration && (
        <>
          {([
            { left: 8, top: 10 },
            { right: 8, top: 10 },
            { right: 8, bottom: shouldShowTitle ? 34 : 16 },
            { left: 8, bottom: shouldShowTitle ? 34 : 16 },
          ] as const).map((corner, index) => (
            <View
              key={`corner-${index}`}
              style={[
                styles.cornerRune,
                { borderColor: `${accentColor}80`, backgroundColor: `${accentColor}18` },
                corner,
              ]}
            />
          ))}
        </>
      )}

      {/* Main crest SVG */}
      <Animated.View style={{ transform: [{ scale: pulseScale }, { translateY: sigilFloat }] }}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="crestGrad" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity={variant === 'heroic' ? '0.34' : '0.25'} />
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
            opacity={0.9}
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
        <Text
          style={[
            styles.title,
            variant === 'heroic' && styles.titleHeroic,
            { color: accentColor, maxWidth: size + 26 },
          ]}
          numberOfLines={1}
        >
          {hero.className}
        </Text>
      )}
      {weeklySettings.weeklyRewardBadge && weeklySettings.weeklyRewardWeekKey === weeklySettings.weeklyPathWeekKey && activeWeeklyPath && (
        <View style={[styles.weeklyRibbon, { borderColor: accentColor }]}>
          <Text style={[styles.weeklyRibbonText, { color: accentColor }]} numberOfLines={1}>
            {weeklySettings.weeklyRewardBadge}
          </Text>
        </View>
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
  particleOrbit: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  cornerRune: {
    position: 'absolute',
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
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
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  titleHeroic: {
    fontSize: fontSize.sm,
  },
  weeklyRibbon: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(9, 11, 20, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: 110,
  },
  weeklyRibbonText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
