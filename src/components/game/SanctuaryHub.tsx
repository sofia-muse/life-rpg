import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import AppLottie from '../animated/AppLottie';
import { colors, fontSize, radius, spacing } from '../../config/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { playGameFeedback } from '../../utils/gameFeedback';

const EMBERS = [0, 1, 2, 3, 4, 5];

export function SanctuaryEmbers({ period }: { period: 'dawn' | 'day' | 'dusk' | 'night' }) {
  const night = period === 'night' || period === 'dusk';
  return (
    <View pointerEvents="none" style={styles.emberLayer}>
      <AppLottie
        source={require('../../../assets/animations/aura-glow.json')}
        autoPlay
        loop
        style={[styles.aura, { opacity: night ? 0.55 : 0.22 }]}
      />
      {EMBERS.map((index) => (
        <Ember key={index} index={index} bright={night} />
      ))}
    </View>
  );
}

function Ember({ index, bright }: { index: number; bright: boolean }) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rise, { toValue: 1, duration: 2800 + index * 380, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [index, rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [8, -46 - index * 6] });
  const opacity = rise.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, bright ? 0.85 : 0.35, 0] });

  return (
    <Animated.View
      style={[
        styles.ember,
        {
          left: `${12 + index * 14}%`,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

const NPCS: { id: string; name: string; role: string; line: string; href: Href; icon: string }[] = [
  {
    id: 'quests',
    name: 'Quartermaster',
    role: 'Adventures',
    line: 'The board is fresh. Claim a victory.',
    href: '/quests',
    icon: '⚔',
  },
  {
    id: 'forge',
    name: 'Smith',
    role: 'Skills',
    line: 'Bring me a spark. I will forge it.',
    href: '/skills',
    icon: '⚒',
  },
  {
    id: 'raids',
    name: 'Raid Board',
    role: 'Raids',
    line: 'The cohort waits. Log your share.',
    href: '/raids',
    icon: '⛨',
  },
];

export function SanctuaryNpcs() {
  const router = useRouter();
  const [speaking, setSpeaking] = useState<string | null>(null);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  const speak = (npc: (typeof NPCS)[number]) => {
    setSpeaking(npc.id);
    useUIStore.getState().pushToast(npc.line);
    void playGameFeedback('click', hapticEnabled);
    setTimeout(() => {
      setSpeaking(null);
      router.push(npc.href);
    }, 1200);
  };

  return (
    <View style={styles.npcRow}>
      {NPCS.map((npc) => (
        <NpcCard key={npc.id} npc={npc} speaking={speaking === npc.id} onPress={() => speak(npc)} />
      ))}
    </View>
  );
}

function NpcCard({
  npc,
  speaking,
  onPress,
}: {
  npc: (typeof NPCS)[number];
  speaking: boolean;
  onPress: () => void;
}) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [sway]);

  const translateY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <TouchableOpacity style={styles.npc} onPress={onPress} activeOpacity={0.85}>
      <Animated.Text style={[styles.npcIcon, { transform: [{ translateY }] }]}>{npc.icon}</Animated.Text>
      <Text style={styles.npcName}>{npc.name}</Text>
      <Text style={styles.npcRole}>{npc.role}</Text>
      {speaking ? <Text style={styles.bubble}>{npc.line}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emberLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 180,
    height: 180,
  },
  ember: {
    position: 'absolute',
    bottom: 18,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  npcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  npc: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 108,
  },
  npcIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  npcName: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontWeight: '800',
    textAlign: 'center',
  },
  npcRole: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  bubble: {
    marginTop: spacing.xs,
    color: colors.gold,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
});
