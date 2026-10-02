import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { spacing } from '../../config/theme';
import { SCENE } from './SceneFigure';

interface Props {
  heroName?: string;
}

/** Leather-bound ledger sitting above the chronicle entries. */
export function JournalLedger({ heroName }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 820;

  return (
    <View style={[styles.book, compact && styles.bookCompact]}>
      <View style={styles.page}>
        <Svg width="100%" height={compact ? 52 : 64} viewBox="0 0 100 28" preserveAspectRatio="none">
          {[8, 14, 20, 26].map((y) => (
            <Line key={y} x1="4" y1={String(y)} x2="96" y2={String(y)} stroke="#E4D2B0" strokeWidth="0.6" />
          ))}
        </Svg>
        <View style={styles.pageCopy}>
          <Text style={styles.kicker}>Bound ledger</Text>
          <Text style={styles.title} numberOfLines={1}>
            Chronicle
          </Text>
          {heroName ? (
            <Text style={styles.hero} numberOfLines={1}>
              {heroName}
            </Text>
          ) : null}
          <Text style={styles.hint}>A living record of your campaign</Text>
        </View>
      </View>
      <View style={styles.ribbon} />
    </View>
  );
}

const styles = StyleSheet.create({
  book: {
    height: 168,
    marginBottom: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#4A2C1A',
    borderWidth: 3,
    borderColor: SCENE.barTop,
    padding: 10,
    overflow: 'hidden',
  },
  bookCompact: {
    height: 132,
    padding: 8,
  },
  page: {
    flex: 1,
    backgroundColor: SCENE.cream,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C4A06A',
    overflow: 'hidden',
  },
  pageCopy: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  kicker: {
    color: '#8C3A32',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: SCENE.inkDark,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  hero: {
    color: '#6B4228',
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: '#6B4228',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    right: 28,
    width: 14,
    height: 46,
    backgroundColor: '#8C3A32',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
