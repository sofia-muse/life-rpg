import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { NiceAvatarCharacter } from '../avatar/NiceAvatarCharacter';
import { CharacterEvent } from '../avatar/anime/useExpressionState';
import { fontSize, spacing } from '../../config/theme';
import { Hero, STAT_COLORS } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { playGameFeedback } from '../../utils/gameFeedback';
import { SanctuaryEmbers } from './SanctuaryHub';

const WOOD = {
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
};

const PATRONS: {
  id: string;
  name: string;
  line: string;
  href: Href;
  icon: string;
  cloak: string;
  prop: string;
}[] = [
  {
    id: 'quests',
    name: 'Quartermaster',
    line: 'The board is fresh. Claim a victory.',
    href: '/quests',
    icon: '⚔',
    cloak: '#8C3A32',
    prop: 'Quest board',
  },
  {
    id: 'forge',
    name: 'Smith',
    line: 'Bring me a spark. I will forge it.',
    href: '/skills',
    icon: '⚒',
    cloak: '#8A5A32',
    prop: 'Anvil',
  },
  {
    id: 'raids',
    name: 'Raid Herald',
    line: 'The cohort waits. Log your share.',
    href: '/raids',
    icon: '⛨',
    cloak: '#3E4F6B',
    prop: 'Raid notice',
  },
];

interface Props {
  hero: Hero;
  greeting: string;
  period: 'dawn' | 'day' | 'dusk' | 'night';
  characterEvent: CharacterEvent;
  compact: boolean;
}

export function TavernRoom({ hero, greeting, period, characterEvent, compact }: Props) {
  const router = useRouter();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const avatarSize = compact ? 64 : 84;

  const speak = (patron: (typeof PATRONS)[number]) => {
    setSpeaking(patron.id);
    useUIStore.getState().pushToast(patron.line);
    void playGameFeedback('click', hapticEnabled);
    setTimeout(() => {
      setSpeaking(null);
      router.push(patron.href);
    }, 1100);
  };

  return (
    <View style={[styles.room, compact && styles.roomCompact]}>
      <View style={styles.wall}>
        <View style={styles.beam} />
        <View style={styles.sign}>
          <Text style={styles.signText} numberOfLines={1}>
            {greeting}
          </Text>
        </View>

        <View style={styles.hooks}>
          <TouchableOpacity
            onPress={() => router.push('/modal')}
            style={styles.hook}
            accessibilityLabel="Settings"
          >
            <Text style={styles.hookIcon}>⚙</Text>
          </TouchableOpacity>
          <View style={styles.hookCluster}>
            <TouchableOpacity
              onPress={() => router.push('/achievements' as Href)}
              style={styles.shield}
              accessibilityLabel="Trophies"
            >
              <Text style={styles.shieldMark}>✦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/map' as Href)}
              style={styles.door}
              accessibilityLabel="World Map"
            >
              <View style={styles.doorPanel} />
              <Text style={styles.doorLabel}>World Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hearth} accessibilityLabel="Hearth">
          <View style={styles.hearthMouth}>
            <SanctuaryEmbers period={period} />
          </View>
          <View style={styles.hearthStone} />
        </View>
      </View>

      <View style={[styles.bar, compact && styles.barCompact]}>
        {PATRONS.map((patron) => (
          <View key={patron.id} style={styles.barProp}>
            <View style={[styles.propBlock, patron.id === 'forge' && styles.anvil]} />
            <Text style={styles.propLabel} numberOfLines={1}>
              {patron.prop}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.floor, compact && styles.floorCompact]}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 40" preserveAspectRatio="none">
          {[8, 16, 24, 32].map((y) => (
            <Line key={y} x1="0" y1={String(y)} x2="100" y2={String(y)} stroke={WOOD.floorLine} strokeWidth="0.6" />
          ))}
        </Svg>

        <View style={styles.patronRow}>
          {PATRONS.map((patron) => (
            <Patron
              key={patron.id}
              patron={patron}
              speaking={speaking === patron.id}
              compact={compact}
              onPress={() => speak(patron)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.heroSpot}
          onPress={() => router.push('/customize')}
          activeOpacity={0.9}
          accessibilityLabel="Open the atelier"
        >
          <NiceAvatarCharacter
            appearance={hero.characterAppearance}
            dominantStat={hero.dominantStat}
            classTier={hero.classTier}
            size={avatarSize}
            event={characterEvent}
          />
          <View style={[styles.plaque, { borderColor: STAT_COLORS[hero.dominantStat] }]}>
            <Text style={styles.plaqueName} numberOfLines={1}>
              {hero.name}
            </Text>
            <Text style={styles.plaqueClass} numberOfLines={1}>
              {hero.className}
            </Text>
            <Text style={styles.plaqueLevel}>Hero level {hero.heroLevel}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Patron({
  patron,
  speaking,
  compact,
  onPress,
}: {
  patron: (typeof PATRONS)[number];
  speaking: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1500 + patron.name.length * 80, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1500 + patron.name.length * 80, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [patron.name.length, sway]);

  const translateY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <TouchableOpacity style={styles.patron} onPress={onPress} activeOpacity={0.85}>
      {speaking ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{patron.line}</Text>
        </View>
      ) : null}
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View style={[styles.cloak, compact && styles.cloakCompact, { backgroundColor: patron.cloak }]}>
          <View style={styles.head} />
          <Text style={styles.patronIcon}>{patron.icon}</Text>
        </View>
        <Text style={styles.patronName} numberOfLines={1}>
          {patron.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  room: {
    height: 648,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: WOOD.beam,
    backgroundColor: WOOD.wallDeep,
  },
  roomCompact: {
    height: 588,
  },
  wall: {
    flex: 1,
    backgroundColor: WOOD.wall,
    minHeight: 150,
  },
  beam: {
    height: 10,
    backgroundColor: WOOD.beam,
  },
  sign: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    backgroundColor: WOOD.plaque,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    maxWidth: '46%',
  },
  signText: {
    color: WOOD.ink,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  hooks: {
    position: 'absolute',
    top: 16,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hookCluster: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  hook: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 12, 8, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WOOD.barTop,
  },
  hookIcon: {
    color: WOOD.ink,
    fontSize: 16,
  },
  door: {
    width: 74,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#6A3E24',
    borderWidth: 3,
    borderColor: WOOD.barTop,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  doorPanel: {
    position: 'absolute',
    top: 10,
    width: 46,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#8A5430',
    borderWidth: 2,
    borderColor: '#3A2416',
  },
  doorLabel: {
    color: WOOD.ink,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  shield: {
    width: 36,
    height: 42,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#8C3A32',
    borderWidth: 2,
    borderColor: WOOD.barTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldMark: {
    color: WOOD.barTop,
    fontSize: 14,
    fontWeight: '900',
  },
  hearth: {
    position: 'absolute',
    left: 18,
    bottom: 0,
    width: 92,
    alignItems: 'center',
  },
  hearthMouth: {
    width: 72,
    height: 64,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#1A100C',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: WOOD.stone,
  },
  hearthStone: {
    width: 92,
    height: 14,
    backgroundColor: WOOD.stone,
    borderTopWidth: 3,
    borderTopColor: WOOD.fire,
  },
  bar: {
    height: 54,
    backgroundColor: WOOD.bar,
    borderTopWidth: 8,
    borderTopColor: WOOD.barTop,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
  },
  barCompact: {
    paddingHorizontal: spacing.sm,
  },
  barProp: {
    alignItems: 'center',
    width: 88,
  },
  propBlock: {
    width: 36,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#E7D3A1',
    borderWidth: 2,
    borderColor: '#6B4228',
  },
  anvil: {
    width: 28,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#6E7278',
    borderColor: '#2E3136',
  },
  propLabel: {
    color: WOOD.muted,
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
  },
  floor: {
    height: 298,
    backgroundColor: WOOD.floor,
  },
  floorCompact: {
    height: 276,
  },
  patronRow: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  patron: {
    alignItems: 'center',
    width: 108,
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
  patronIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  patronName: {
    color: WOOD.ink,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  bubble: {
    position: 'absolute',
    bottom: 78,
    width: 150,
    backgroundColor: '#F7E7C6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 5,
  },
  bubbleText: {
    color: '#3A2416',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSpot: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  plaque: {
    marginTop: 2,
    backgroundColor: WOOD.plaque,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 140,
  },
  plaqueName: {
    color: WOOD.ink,
    fontSize: fontSize.sm,
    fontWeight: '900',
  },
  plaqueClass: {
    color: WOOD.barTop,
    fontSize: 11,
    fontWeight: '700',
  },
  plaqueLevel: {
    color: WOOD.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
