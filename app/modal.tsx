import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/settingsStore';
import { useHeroStore } from '../src/store/heroStore';
import { colors, spacing, fontSize, radius } from '../src/config/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    notificationsEnabled,
    hapticEnabled,
    reminderTime,
    toggleNotifications,
    toggleHaptic,
    setReminderTime,
  } = useSettingsStore();
  const hero = useHeroStore((s) => s.hero);

  const [editingTime, setEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(reminderTime);

  const handleResetHero = () => {
    Alert.alert('Reset Hero', 'This will delete your hero and all progress. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          useHeroStore.setState({ hero: null, isOnboarded: false });
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero info */}
        {hero && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hero</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{hero.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Class</Text>
              <Text style={styles.value}>
                {hero.className} (Tier {hero.classTier})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Level</Text>
              <Text style={styles.value}>{hero.heroLevel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Quests Completed</Text>
              <Text style={styles.value}>{hero.totalQuestsCompleted}</Text>
            </View>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
              thumbColor={notificationsEnabled ? colors.gold : colors.textMuted}
            />
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Daily Reminder</Text>
              <Text style={styles.sublabel}>Get reminded to complete quests</Text>
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
                >
                  <Text style={styles.saveBtn}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingTime(true)}>
                <Text style={styles.timeValue}>{reminderTime}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Haptic Feedback</Text>
              <Text style={styles.sublabel}>Vibration on actions</Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={toggleHaptic}
              trackColor={{ false: colors.bgInput, true: `${colors.gold}60` }}
              thumbColor={hapticEnabled ? colors.gold : colors.textMuted}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetHero}>
            <Text style={styles.dangerBtnText}>Reset Hero & Progress</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Life RPG v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backText: { color: colors.gold, fontSize: fontSize.md, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '900' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textAccent,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: { color: colors.textPrimary, fontSize: fontSize.md },
  sublabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  value: { color: colors.textSecondary, fontSize: fontSize.md },
  timeEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 70,
    textAlign: 'center',
  },
  saveBtn: { color: colors.gold, fontSize: fontSize.sm, fontWeight: '700' },
  timeValue: { color: colors.gold, fontSize: fontSize.md, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: `${colors.error}20`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerBtnText: { color: colors.error, fontSize: fontSize.md, fontWeight: '700' },
  version: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
