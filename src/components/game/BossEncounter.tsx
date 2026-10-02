import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { spacing } from '../../config/theme';
import { TweenBar } from './TweenBar';
import { RAID_HERALD, SCENE, SceneFigure, useSceneSpeech } from './SceneFigure';

interface Props {
  bossName: string;
  /** Shared raid progress, 0–1. The bar shows the health still standing. */
  progress: number;
  meterLabel: string;
  color: string;
  defeated?: boolean;
  /** No live raid — keep the herald, hide the health bar. */
  dormant?: boolean;
}

/** The current raid drawn as one foe, with the raid herald beside it. */
export function BossEncounter({ bossName, progress, meterLabel, color, defeated = false, dormant = false }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const { speaking, speak } = useSceneSpeech(RAID_HERALD.line);
  const clamped = Math.max(0, Math.min(1, progress));
  const remaining = defeated ? 0 : 1 - clamped;

  return (
    <View style={[styles.lair, compact && styles.lairCompact]}>
      <View style={styles.beam} />
      <View style={styles.sign}>
        <Text style={styles.signText} numberOfLines={1}>
          {bossName}
        </Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.bossCol}>
          <BossSilhouette color={color} compact={compact} faded={dormant || defeated} />
          <Svg width={compact ? 120 : 168} height={22} viewBox="0 0 100 16">
            <Ellipse cx="50" cy="8" rx="40" ry="5" fill="rgba(0,0,0,0.35)" />
          </Svg>
          {defeated ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Defeated</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heraldCol}>
          <SceneFigure
            name={RAID_HERALD.name}
            line={RAID_HERALD.line}
            icon={RAID_HERALD.icon}
            cloak={RAID_HERALD.cloak}
            compact={compact}
            speaking={speaking}
            onPress={speak}
            bubbleAnchor="end"
          />
        </View>
      </View>

      <View style={styles.plate}>
        {dormant ? (
          <Text style={styles.meter}>{meterLabel}</Text>
        ) : (
          <>
            <View style={styles.hpRow}>
              <Text style={styles.hpLabel}>Boss HP</Text>
              <Text style={styles.hpValue}>{Math.round(remaining * 100)}%</Text>
            </View>
            <TweenBar progress={remaining} color={SCENE.health} height={12} />
            <Text style={styles.meter}>{meterLabel}</Text>
          </>
        )}
      </View>
    </View>
  );
}

function BossSilhouette({ color, compact, faded }: { color: string; compact: boolean; faded: boolean }) {
  const body = compact ? 86 : 124;
  return (
    <View style={[styles.boss, faded && styles.bossFaded, { width: body + 28 }]}>
      <View style={[styles.horn, styles.hornLeft, { backgroundColor: color }]} />
      <View style={[styles.horn, styles.hornRight, { backgroundColor: color }]} />
      <View
        style={[
          styles.torso,
          {
            backgroundColor: color,
            width: body,
            height: Math.round(body * 0.92),
            borderRadius: body / 2,
          },
        ]}
      >
        <View style={styles.eyes}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.maw} />
      </View>
      <View style={styles.feet}>
        <View style={[styles.foot, { backgroundColor: color }]} />
        <View style={[styles.foot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lair: {
    height: 360,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: SCENE.beam,
    backgroundColor: SCENE.wallDeep,
  },
  lairCompact: {
    height: 292,
  },
  beam: {
    height: 10,
    backgroundColor: SCENE.beam,
  },
  sign: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    backgroundColor: SCENE.plaque,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    maxWidth: '70%',
    borderWidth: 1,
    borderColor: SCENE.barTop,
  },
  signText: {
    color: SCENE.ink,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  bossCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  heraldCol: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    zIndex: 3,
  },
  boss: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bossFaded: {
    opacity: 0.45,
  },
  horn: {
    position: 'absolute',
    top: -10,
    width: 16,
    height: 28,
    borderRadius: 8,
    zIndex: 1,
  },
  hornLeft: {
    left: 18,
    transform: [{ rotate: '-32deg' }],
  },
  hornRight: {
    right: 18,
    transform: [{ rotate: '32deg' }],
  },
  torso: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  eyes: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SCENE.cream,
    borderWidth: 2,
    borderColor: SCENE.inkDark,
  },
  maw: {
    marginTop: 10,
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: SCENE.inkDark,
  },
  feet: {
    flexDirection: 'row',
    gap: 18,
    marginTop: -6,
  },
  foot: {
    width: 22,
    height: 14,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  banner: {
    position: 'absolute',
    top: '42%',
    backgroundColor: SCENE.cream,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    transform: [{ rotate: '-8deg' }],
  },
  bannerText: {
    color: SCENE.health,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  plate: {
    backgroundColor: SCENE.plaque,
    borderTopWidth: 4,
    borderTopColor: SCENE.barTop,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hpLabel: {
    color: SCENE.ink,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  hpValue: {
    color: SCENE.barTop,
    fontSize: 11,
    fontWeight: '800',
  },
  meter: {
    color: SCENE.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});
