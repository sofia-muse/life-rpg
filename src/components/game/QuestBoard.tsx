import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { spacing } from '../../config/theme';
import { STAT_ICONS, StatName } from '../../types';
import { QUARTERMASTER, SCENE, SceneFigure, useSceneSpeech } from './SceneFigure';

export interface BoardNotice {
  id: string;
  title: string;
  difficulty: string;
  stat: StatName;
}

interface Props {
  notices: BoardNotice[];
}

/** Wooden wall and pinned contracts, with the quartermaster beside the board. */
export function QuestBoard({ notices }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const shown = notices.slice(0, compact ? 2 : 4);
  const { speaking, speak } = useSceneSpeech(QUARTERMASTER.line);

  return (
    <View style={[styles.scene, compact && styles.sceneCompact]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 40" preserveAspectRatio="none">
        {[5, 12, 19, 26, 33].map((y) => (
          <Line key={y} x1="0" y1={String(y)} x2="100" y2={String(y)} stroke={SCENE.wallDeep} strokeWidth="0.7" />
        ))}
      </Svg>
      <View style={styles.beam} />

      <View style={styles.row}>
        <View style={styles.board}>
          <View style={styles.boardFrame}>
            <Text style={styles.boardLabel}>Quest board</Text>
            <View style={styles.papers}>
              {shown.length === 0 ? (
                <View style={[styles.paper, styles.paperEmpty]}>
                  <View style={styles.pin} />
                  <Text style={styles.paperTitle}>The board is clear.</Text>
                  <Text style={styles.paperMeta}>Pin a contract below.</Text>
                </View>
              ) : (
                shown.map((notice, index) => (
                  <View
                    key={notice.id}
                    style={[
                      styles.paper,
                      compact ? styles.paperCompact : styles.paperWide,
                      { transform: [{ rotate: index % 2 === 0 ? '-1.5deg' : '1.5deg' }] },
                    ]}
                  >
                    <View style={[styles.pin, index % 2 === 0 ? styles.pinRed : styles.pinGold]} />
                    <Text style={styles.paperTitle} numberOfLines={2}>
                      {notice.title}
                    </Text>
                    <Text style={styles.paperMeta} numberOfLines={1}>
                      {STAT_ICONS[notice.stat]} {notice.difficulty}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.figure}>
          <SceneFigure
            name={QUARTERMASTER.name}
            line={QUARTERMASTER.line}
            icon={QUARTERMASTER.icon}
            cloak={QUARTERMASTER.cloak}
            compact={compact}
            speaking={speaking}
            onPress={speak}
            bubbleAnchor="end"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: SCENE.beam,
    backgroundColor: SCENE.wall,
  },
  sceneCompact: {
    height: 236,
  },
  beam: {
    height: 10,
    backgroundColor: SCENE.beam,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  board: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    minWidth: 0,
  },
  boardFrame: {
    flex: 1,
    backgroundColor: SCENE.cork,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: SCENE.barTop,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  boardLabel: {
    color: SCENE.ink,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  papers: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignContent: 'flex-start',
  },
  paper: {
    backgroundColor: SCENE.cream,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 64,
  },
  paperWide: {
    width: '47%',
  },
  paperCompact: {
    width: '100%',
  },
  paperEmpty: {
    width: '70%',
    maxWidth: 220,
  },
  pin: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: SCENE.inkDark,
  },
  pinRed: {
    backgroundColor: '#8C3A32',
  },
  pinGold: {
    backgroundColor: SCENE.barTop,
  },
  paperTitle: {
    color: SCENE.inkDark,
    fontSize: 12,
    fontWeight: '800',
  },
  paperMeta: {
    color: '#6B4228',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  figure: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    zIndex: 3,
  },
});
