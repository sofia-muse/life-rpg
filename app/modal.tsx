import { Text, TextInput } from '../src/components/layout/StoryText';
import { SyncStatusPanel } from '../src/components/game/SyncStatusPanel';
import { env } from '../src/config/env';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  Platform} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { Card } from '../src/components/layout/Card';
import { Button } from '../src/components/layout/Button';
import { useSettingsStore } from '../src/store/settingsStore';
import { useHeroStore } from '../src/store/heroStore';
import { useGameplayStore } from '../src/store/gameplayStore';
import { colors, spacing, fontSize, radius, typography } from '../src/config/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    notificationsEnabled,
    hapticEnabled,
    reminderTime,
    aiSkillsEnabled,
    fantasyNames,
    toggleNotifications,
    toggleHaptic,
    setReminderTime,
    toggleAiSkills,
    toggleFantasyNames,
  } = useSettingsStore();
  const hero = useHeroStore((s) => s.hero);

  const [confirmReset, setConfirmReset] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [editingTime, setEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(reminderTime);

  const handleResetHero = () => setConfirmReset(true);

  return (
    <ScreenWrapper contentWidth="regular">
      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReset(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.confirmTitle}>
              Begin again?
            </Text>
            <Text style={styles.confirmCopy}>
              This removes your hero and all saved progress on this device. This cannot be undone.
            </Text>
            <Button title="Keep journey" onPress={() => setConfirmReset(false)} />
            <Button
              title="Reset hero permanently"
              variant="secondary"
              onPress={() => {
                setConfirmReset(false);
                useGameplayStore.getState().resetLocalState();
                router.replace('/onboarding');
              }}
            />
          </View>
        </View>
      </Modal>
      <ScreenHeader
        eyebrow="Sanctuary"
        title="Comforts and Rituals"
        subtitle="Adjust the quiet systems around your journey without losing the atmosphere."
        action={
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Return to previous screen"
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Return</Text>
          </TouchableOpacity>
        }
      />

      <SyncStatusPanel />

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
              <Button
                title="Open Codex"
                onPress={() => router.push('/codex')}
                style={styles.quickActionButton}
              />
            </View>
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Daily Rhythms</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Quest Bells</Text>
            <Text style={styles.sublabel}>
              {Platform.OS === 'web'
                ? 'Reminders are available in the mobile app.'
                : 'Turn reminder prompts on or off.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Quest reminders"
            disabled={Platform.OS === 'web'}
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
                accessibilityLabel="Reminder time in HH:MM format"
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                maxLength={5}
              />
              <TouchableOpacity
                onPress={() => {
                  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(tempTime)) {
                    setTimeError('Use a valid time, for example 09:30.');
                    return;
                  }
                  setTimeError('');
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
        {timeError ? (
          <Text accessibilityLiveRegion="polite" style={styles.timeError}>
            {timeError}
          </Text>
        ) : null}
        <Text style={styles.sectionTitle}>Comforts</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Haptic Feedback</Text>
            <Text style={styles.sublabel}>
              {Platform.OS === 'web'
                ? 'Haptics are available in the mobile app.'
                : 'A small pulse when an action lands.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Haptic feedback"
            disabled={Platform.OS === 'web'}
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
              {env.demoMode
                ? 'AI forging is not available in this offline demo.'
                : 'Forge a unique gift when online and signed in.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="AI-forged skills"
            disabled={env.demoMode}
            value={aiSkillsEnabled}
            onValueChange={toggleAiSkills}
            trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
            thumbColor={aiSkillsEnabled ? colors.gold : colors.textMuted}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.label}>Fantasy Quest Names</Text>
            <Text style={styles.sublabel}>
              Show RPG-flavored titles alongside your real quest names.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Fantasy quest names"
            value={fantasyNames}
            onValueChange={toggleFantasyNames}
            trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
            thumbColor={fantasyNames ? colors.gold : colors.textMuted}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickActionRow}>
          <Button
            title="Adventures"
            onPress={() => router.push('/quests')}
            style={styles.quickActionButton}
          />
          <Button
            title="World Map"
            onPress={() => router.push('/map' as Href)}
            variant="secondary"
            style={styles.quickActionButton}
          />
          <Button
            title="Trophy Hall"
            onPress={() => router.push('/achievements' as Href)}
            style={styles.quickActionButton}
          />
          <Button
            title="Chronicle"
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
  confirmOverlay: { flex: 1, backgroundColor: colors.veil, justifyContent: 'center', padding: 20 },
  confirmCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  confirmTitle: { color: colors.textPrimary, fontSize: 24 },
  confirmCopy: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  timeError: { color: colors.error, fontSize: 14, marginTop: 8 },
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
