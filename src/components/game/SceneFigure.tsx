import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontSize } from '../../config/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { playGameFeedback } from '../../utils/gameFeedback';

/** Wood, cream, and cloak colors shared with the tavern room. */
export const SCENE = {
  wall: '#3C2618',
  wallDeep: '#2A1A10',
  beam: '#6B4228',
  floor: '#7A4E30',
  floorLine: '#5C3A22',
  bar: '#4A2C1A',
  barTop: '#C4A06A',
  plaque: '#5C3A22',
  stone: '#5A534C',
  fire: '#E07A2F',
  ink: '#F3E6D0',
  muted: '#D7C4A8',
  cream: '#F7E7C6',
  inkDark: '#3A2416',
  health: '#C44536',
  cork: '#8A6244',
};

export const QUARTERMASTER = {
  name: 'Quartermaster',
  line: 'The board is fresh. Claim a victory.',
  icon: '⚔',
  cloak: '#8C3A32',
} as const;

export const SMITH = {
  name: 'Smith',
  line: 'Bring me a spark. I will forge it.',
  icon: '⚒',
  cloak: '#8A5A32',
} as const;

export const RAID_HERALD = {
  name: 'Raid Herald',
  line: 'The cohort waits. Log your share.',
  icon: '⛨',
  cloak: '#3E4F6B',
} as const;

/** Shows the line in a cream bubble and a toast, then clears. Does not navigate. */
export function useSceneSpeech(line: string) {
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const [speaking, setSpeaking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const speak = () => {
    setSpeaking(true);
    useUIStore.getState().pushToast(line);
    void playGameFeedback('click', hapticEnabled);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpeaking(false), 1100);
  };

  return { speaking, speak };
}

interface FigureProps {
  name: string;
  line: string;
  icon: string;
  cloak: string;
  compact: boolean;
  speaking: boolean;
  onPress: () => void;
  /** Keep the bubble inside the scene when the figure stands on the right. */
  bubbleAnchor?: 'start' | 'end';
}

export function SceneFigure({
  name,
  line,
  icon,
  cloak,
  compact,
  speaking,
  onPress,
  bubbleAnchor = 'end',
}: FigureProps) {
  return (
    <TouchableOpacity
      style={styles.patron}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {speaking ? (
        <View style={[styles.bubble, bubbleAnchor === 'end' ? styles.bubbleEnd : styles.bubbleStart]}>
          <Text style={styles.bubbleText}>{line}</Text>
        </View>
      ) : null}
      <View>
        <View style={[styles.cloak, compact && styles.cloakCompact, { backgroundColor: cloak }]}>
          <View style={[styles.head, compact && styles.headCompact]} />
          <Text style={styles.patronIcon}>{icon}</Text>
        </View>
        <Text style={styles.patronName} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  patron: {
    alignItems: 'center',
    width: 108,
    zIndex: 4,
  },
  cloak: {
    width: 54,
    height: 62,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  cloakCompact: {
    width: 46,
    height: 52,
  },
  head: {
    position: 'absolute',
    top: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6C2A0',
  },
  headCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
    top: -8,
  },
  patronIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  patronName: {
    color: SCENE.ink,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  bubble: {
    position: 'absolute',
    bottom: 78,
    width: 168,
    backgroundColor: SCENE.cream,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 6,
  },
  bubbleEnd: {
    right: 0,
  },
  bubbleStart: {
    left: 0,
  },
  bubbleText: {
    color: SCENE.inkDark,
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    textAlign: 'center',
  },
});
