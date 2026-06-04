import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CharacterCustomizer } from '../src/components/avatar/CharacterCustomizer';
import { CrestCustomizer } from '../src/components/avatar/CrestCustomizer';
import { colors, spacing, fontSize, radius } from '../src/config/theme';

type Tab = 'character' | 'crest';

export default function CustomizeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('character');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customize</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'character' && styles.tabActive]}
          onPress={() => setTab('character')}
        >
          <Text style={[styles.tabText, tab === 'character' && styles.tabTextActive]}>
            Character
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'crest' && styles.tabActive]}
          onPress={() => setTab('crest')}
        >
          <Text style={[styles.tabText, tab === 'crest' && styles.tabTextActive]}>Crest</Text>
        </TouchableOpacity>
      </View>

      {tab === 'character' ? <CharacterCustomizer /> : <CrestCustomizer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 70,
  },
  backText: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.bgPrimary,
  },
});
