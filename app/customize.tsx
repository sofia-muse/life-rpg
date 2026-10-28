import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CharacterCustomizer } from '../src/components/avatar/CharacterCustomizer';
import { CrestCustomizer } from '../src/components/avatar/CrestCustomizer';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Button } from '../src/components/layout/Button';
import { colors, spacing } from '../src/config/theme';

export default function CustomizeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'character' | 'crest'>('character');
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScreenWrapper contentWidth="regular" showScrollIndicator>
      <ScreenHeader
        eyebrow="Hero Atelier"
        title="A face for your legend"
        subtitle="Choose a painted portrait or craft your own illustration."
        action={<Button title="Done" onPress={leave} size="sm" />}
      />
      <View style={styles.tabs}>
        {(['character', 'crest'] as const).map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setTab(value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            accessibilityLabel={value === 'character' ? 'Character' : 'Crest'}
            style={[styles.tab, tab === value && styles.active]}
          >
            <Text style={styles.text}>{value === 'character' ? 'Character' : 'Crest'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'character' ? <CharacterCustomizer /> : <CrestCustomizer />}
      <View style={styles.footer}>
        <Text style={styles.hint}>Your appearance is saved automatically.</Text>
        <Button title="Back to sanctuary" onPress={() => router.replace('/')} />
      </View>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  tab: {
    flex: 1,
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  text: { color: colors.textPrimary, fontSize: 16 },
  footer: { gap: 16, paddingVertical: 24 },
  hint: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
