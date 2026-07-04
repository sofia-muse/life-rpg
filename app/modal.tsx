import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Button } from '../src/components/layout/Button';
import { useSettingsStore } from '../src/store/settingsStore';
import { useHeroStore } from '../src/store/heroStore';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    notificationsEnabled,
    hapticEnabled,
    reminderTime,
    aiSkillsEnabled,
    toggleNotifications,
    toggleHaptic,
    setReminderTime,
    toggleAiSkills,
  } = useSettingsStore();
  const hero = useHeroStore((s) => s.hero);

  const [editingTime, setEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(reminderTime);

  const handleResetHero = () => {
    Alert.alert('Begin Again?', 'This will release your current hero and all progress. This cannot be undone.', [
      { text: 'Keep Journey', style: 'cancel' },
      {
        text: 'Reset Hero',
        style: 'destructive',
        onPress: () => {
          useHeroStore.setState({ hero: null, isOnboarded: false });
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <ScreenWrapper contentWidth="regular">
      <ScreenHeader
        eyebrow="Sanctuary"
        title="Comforts and Rituals"
        subtitle="Adjust the quiet systems around your journey without losing the atmosphere."
        action={
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Return</Text>
          </TouchableOpacity>
        }
      />

      {hero && (
        <Card tone="accent">
          <Text style={styles.sectionTitle}>Your Hero</Text>
          <View style={styles.heroPanel}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{hero.name}</Text>
              <Text style={styles.heroMeta}>
                {hero.className} · Tier {hero.classTier} · Level {hero.heroLevel}
              </Text>
              <Text style={styles.heroMeta}>
                {hero.totalQuestsCompleted} quests completed · {hero.currentStreak} day streak
              </Text>
            </View>
            <View style={styles.quickActionRow}>
              <Button
                title="Edit Appearance"
                onPress={() => router.push('/customize')}
                variant="secondary"
                style={styles.quickActionButton}
              />
              <Button title="Open Codex" onPress={() => router.push('/codex')} style={styles.quickActionButton} />
            </View>
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Daily Rhythms</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Quest Bells</Text>
            <Text style={styles.sublabel}>Turn reminder prompts on or off.</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
            thumbColor={notificationsEnabled ? colors.gold : colors.textMuted}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Daily Invitation</Text>
            <Text style={styles.sublabel}>Choose the hour your sanctuary calls you back.</Text>
          </View>
          {editingTime ? (
            <View style={styles.timeEdit}>
              <TextInput
                style={styles.timeInput}
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                maxLength={5}
              />
              <TouchableOpacity
                onPress={() => {
                  setReminderTime(tempTime);
                  setEditingTime(false);
                }}
                style={styles.inlineButton}
              >
                <Text style={styles.inlineButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingTime(true)} style={styles.timePill}>
              <Text style={styles.timeValue}>{reminderTime}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Comforts</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Haptic Feedback</Text>
            <Text style={styles.sublabel}>A small pulse when an action lands.</Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={toggleHaptic}
            trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
            thumbColor={hapticEnabled ? colors.gold : colors.textMuted}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>AI-Forged Skills</Text>
            <Text style={styles.sublabel}>
              Forge a unique gift from your journey when online and signed in.
            </Text>
          </View>
          <Switch
            value={aiSkillsEnabled}
            onValueChange={toggleAiSkills}
            trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
            thumbColor={aiSkillsEnabled ? colors.gold : colors.textMuted}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickActionRow}>
          <Button title="Quest Board" onPress={() => router.push('/quests')} style={styles.quickActionButton} />
          <Button
            title="Hero Chronicle"
            onPress={() => router.push('/journal')}
            variant="secondary"
            style={styles.quickActionButton}
          />
        </View>
      </Card>

      <Card style={styles.renewalCard}>
        <Text style={[styles.sectionTitle, styles.renewalTitle]}>Rite of Renewal</Text>
        <Text style={styles.renewalText}>
          This clears your hero and returns the app to its first dawn. Use it only when you truly
          want a fresh start.
        </Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetHero}>
          <Text style={styles.dangerBtnText}>Reset Hero and Progress</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.version}>Life RPG v1.0.0</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlassStrong,
  },
  headerButtonText: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    ...typography.overline,
  },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  heroPanel: {
    gap: spacing.md,
  },
  heroInfo: {
    gap: spacing.xs,
  },
  heroName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    ...typography.heading,
  },
  heroMeta: {
    color: colors.textSoft,
    fontSize: fontSize.sm,
    ...typography.body,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    ...typography.body,
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 4,
    lineHeight: 17,
    ...typography.journal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: 160,
  },
  timeEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeInput: {
    backgroundColor: colors.bgGlassStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 70,
    textAlign: 'center',
    ...typography.body,
  },
  inlineButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlass,
  },
  inlineButtonText: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    ...typography.overline,
  },
  timePill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.bgGlass,
  },
  timeValue: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '600',
    ...typography.heading,
  },
  renewalCard: {
    borderColor: `${colors.error}55`,
  },
  renewalTitle: {
    color: colors.error,
  },
  renewalText: {
    color: colors.textSoft,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
    ...typography.body,
  },
  dangerBtn: {
    backgroundColor: `${colors.error}20`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '700',
    ...typography.headingWide,
  },
  version: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...typography.headingWide,
  },
});
