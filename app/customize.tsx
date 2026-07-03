import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { PageHeader } from '../src/components/layout/PageHeader';
import { Card } from '../src/components/layout/Card';
import { CharacterCustomizer } from '../src/components/avatar/CharacterCustomizer';
import { CrestCustomizer } from '../src/components/avatar/CrestCustomizer';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';

type Tab = 'character' | 'crest';

export default function CustomizeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('character');

  return (
    <ScreenWrapper scroll={false} contentWidth="wide">
      <PageHeader
        eyebrow="Hero Workshop"
        title="Customize"
        subtitle="Refine the face your journey presents to the world, from your character to your crest."
        action={
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        }
      />

      <Card style={styles.tabsCard}>
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
      </Card>

      <View style={styles.content}>{tab === 'character' ? <CharacterCustomizer /> : <CrestCustomizer />}</View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInset,
  },
  backText: {
    ...typography.eyebrow,
    color: colors.textAccent,
    fontSize: fontSize.md,
  },
  tabsCard: { marginBottom: spacing.md },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.bgInset,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.goldBorder,
  },
  tabText: {
    ...typography.eyebrow,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  content: { flex: 1 },
});
