import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { spacing } from '../../config/theme';
import { SCENE, SMITH, SceneFigure, useSceneSpeech } from './SceneFigure';

/** A short smithy strip: anvil, the smith, and their forge line. */
export function SmithyBanner() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const { speaking, speak } = useSceneSpeech(SMITH.line);

  return (
    <View style={[styles.strip, compact && styles.stripCompact]}>
      <View style={styles.beam} />
      <View style={styles.sign}>
        <Text style={styles.signText}>Smithy</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.anvilBlock}>
          <View style={styles.spark} />
          <View style={styles.anvilTop} />
          <View style={styles.anvilWaist} />
          <View style={styles.anvilBase} />
          <Text style={styles.anvilLabel}>Anvil</Text>
        </View>
        <View style={styles.figure}>
          <SceneFigure
            name={SMITH.name}
            line={SMITH.line}
            icon={SMITH.icon}
            cloak={SMITH.cloak}
            compact={compact}
            speaking={speaking}
            onPress={speak}
            bubbleAnchor="end"
          />
        </View>
      </View>
      <View style={styles.floor}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 16" preserveAspectRatio="none">
          {[4, 8, 12].map((y) => (
            <Line key={y} x1="0" y1={String(y)} x2="100" y2={String(y)} stroke={SCENE.floorLine} strokeWidth="0.8" />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: 196,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: SCENE.beam,
    backgroundColor: SCENE.wall,
  },
  stripCompact: {
    height: 172,
  },
  beam: {
    height: 10,
    backgroundColor: SCENE.beam,
  },
  sign: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    backgroundColor: SCENE.plaque,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: SCENE.barTop,
  },
  signText: {
    color: SCENE.ink,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    gap: spacing.lg,
  },
  floor: {
    height: 22,
    backgroundColor: SCENE.floor,
  },
  anvilBlock: {
    alignItems: 'center',
    width: 88,
    marginBottom: 18,
  },
  spark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SCENE.fire,
    marginBottom: 4,
  },
  anvilTop: {
    width: 64,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#6E7278',
    borderWidth: 2,
    borderColor: '#2E3136',
  },
  anvilWaist: {
    width: 22,
    height: 12,
    backgroundColor: '#5A5E64',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#2E3136',
  },
  anvilBase: {
    width: 48,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#4A2C1A',
    borderWidth: 2,
    borderColor: SCENE.barTop,
  },
  anvilLabel: {
    color: SCENE.muted,
    fontSize: 9,
    marginTop: 4,
    fontWeight: '700',
  },
  figure: {
    width: 112,
    alignItems: 'center',
    zIndex: 3,
  },
});
