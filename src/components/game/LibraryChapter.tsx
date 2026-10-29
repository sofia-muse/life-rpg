import { getActiveDailyQuestCapacityBonus } from '../../engine/skillEngine';
import { useSkillStore } from '../../store/skillStore';
import { syncManager } from '../../api/syncManager';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../layout/Card';
import { Button } from '../layout/Button';
import { FantasyIcon } from './FantasyIcon';
import { useHeroStore } from '../../store/heroStore';
import { useQuestStore } from '../../store/questStore';
import { useCompletionStore } from '../../store/completionStore';
import { useLibraryStore, libraryProgress, LIBRARY_DAYS } from '../../store/libraryStore';
import { colors, spacing, fontSize, typography } from '../../config/theme';

const STAGES = [
  { title: 'Dust and silence', text: 'The old library sleeps beneath tangled roots. Your first reading lights a candle at its gate.' },
  { title: 'Lanterns rekindled', text: 'Warm light returns to the shelves. Every reading day restores another fragment of forgotten knowledge.' },
  { title: 'The sealed archive', text: 'Four lanterns burn. One final reading will break the quiet spell around the heart of the library.' },
  { title: 'The library awakens', text: 'The doors open beneath the stars. The grove remembers your patient work, and its stories live again.' },
];

/** One complete, gentle story arc. Missing a day never removes a restored lantern. */
export function LibraryChapter() {
  const router = useRouter();
  const skillIds = useSkillStore((s) => s.unlockedSkills).map((s) => s.skillId);
  const hero = useHeroStore((s) => s.hero);
  const quests = useQuestStore((s) => s.quests);
  const events = useCompletionStore((s) => s.events);
  const savedRun = useLibraryStore((s) => s.run);
  const [habit, setHabit] = useState('Read a book');
  const [minutes, setMinutes] = useState('15');
  const [choosingSlot, setChoosingSlot] = useState(false);
  if (!hero) return null;
  const run = savedRun?.heroId === hero.id ? savedRun : null;
  const progress = run ? libraryProgress(run, events) : 0;
  const stage = STAGES[progress >= 5 ? 3 : progress >= 4 ? 2 : progress >= 2 ? 1 : 0];
  const quest = run ? quests.find((q) => q.id === run.questId) : undefined;
  const minutesValue = Number(minutes);
  const valid = habit.trim().length > 0 && habit.trim().length <= 80 && Number.isInteger(minutesValue)
    && minutesValue >= 5 && minutesValue <= 60;

  const begin = (pauseQuestId?: string) => {
    if (!valid || run) return;
    if (pauseQuestId) useQuestStore.getState().toggleQuestActive(pauseQuestId);
    const before = new Set(useQuestStore.getState().quests.map((q) => q.id));
    useQuestStore.getState().addQuest({ title: habit.trim(), description: `${minutesValue} minutes of reading. Restore the Starlit Library, one gentle day at a time.`,
      type: 'daily', difficulty: 'easy', stat: 'intelligence', xpReward: 15, isActive: true });
    const created = useQuestStore.getState().quests.find((q) => !before.has(q.id));
    if (created) useLibraryStore.getState().start({ heroId: hero.id, questId: created.id, habit, minutes: minutesValue });
    setChoosingSlot(false);
  };

  return <Card style={styles.card}>
    <View style={styles.header}><FantasyIcon stat="intelligence" size={48} />
      <View style={styles.copy}><Text style={styles.overline}>Your first story · Chapter I</Text>
        <Text accessibilityRole="header" style={styles.title}>The Starlit Library</Text></View></View>
    <Text style={styles.stage}>{run ? stage.title : 'Restore a forgotten place through a real reading habit.'}</Text>
    <Text style={styles.body}>{stage.text}</Text>
    {!run ? <>
      <Text style={styles.label}>What would you like to read?</Text>
      <TextInput accessibilityLabel="Library reading goal" value={habit} onChangeText={setHabit} maxLength={80} style={styles.input} />
      <Text style={styles.label}>Minutes per reading day · 5–60</Text>
      <TextInput accessibilityLabel="Minutes per reading day" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} style={styles.input} />
      <Text style={styles.body}>Five reading days restore the library. They do not need to be consecutive. Keep your usual quest XP; the chapter adds a unique title.</Text>
      {choosingSlot ? <View>
        <Text style={styles.body}>Your active daily slots are full. Choose one habit to pause while you begin this chapter. Its history is kept.</Text>
        {quests.filter((q) => q.type === 'daily' && q.isActive).map((q) => <Button key={q.id} title={`Pause ${q.title} and begin`} variant="secondary" onPress={() => begin(q.id)} style={styles.action} />)}
        <Button title="Keep my current habits" variant="secondary" onPress={() => setChoosingSlot(false)} />
      </View> : <Button title="Begin the library chapter" disabled={!valid} onPress={() => {
        // Let the user choose a swap instead of silently pausing another habit.
        const active = quests.filter((q) => q.type === 'daily' && q.isActive).length;
        if (active >= 3 + getActiveDailyQuestCapacityBonus(skillIds)) setChoosingSlot(true); else begin();
      }} />}
    </> : <>
      <Text style={styles.progress}>{progress} / {LIBRARY_DAYS} reading days · lanterns restored</Text>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: LIBRARY_DAYS, now: progress }} style={styles.track}>
        <View style={[styles.fill, { width: `${progress / LIBRARY_DAYS * 100}%` }]} />
      </View>
      <Text style={styles.body}>{run.habit} · {run.minutes} minutes. One lantern per day. Rest days keep your story safe.</Text>
      {progress < LIBRARY_DAYS && <Button title={quest?.isCompleted ? 'Reading saved · visit adventures' : 'Open my reading quest'} onPress={() => router.push('/quests')} />}
      {!quest && progress < LIBRARY_DAYS && <Text style={styles.body}>This habit was removed. Your restored lanterns remain. Restore the habit below to continue.</Text>}
      {!quest && progress < LIBRARY_DAYS && <Button title="Restore reading habit" variant="secondary" onPress={() => {
        // Preserve its identity so the existing chapter history remains attached.
        const now = new Date().toISOString();
        useQuestStore.getState().upsertQuest({ id: run.questId, title: run.habit, description: `${run.minutes} minutes of reading for the Starlit Library.`, type: 'daily', difficulty: 'easy', stat: 'intelligence', xpReward: 15, isActive: false, isCompleted: false, createdAt: now, updatedAt: now, streak: 0, bestStreak: 0, daysCompleted: 0 });
        const restored = useQuestStore.getState().getQuestById(run.questId);
        if (restored) syncManager.enqueue('quest', 'upsert', restored);
      }} />}
      {progress >= LIBRARY_DAYS && !run.claimedAt && <Button title="Claim Keeper of the Starlit Library" onPress={() => useLibraryStore.getState().claim(hero.id, events)} />}
      {run.claimedAt && <><Text style={styles.stage}>Chapter complete · title unlocked</Text><Text style={styles.body}>Keeper of the Starlit Library is waiting in your Trophy Hall. Your reading habit can continue at your own pace.</Text><Button title="Visit Trophy Hall" variant="secondary" onPress={() => router.push('/achievements')} /></>}
    </>}
    <Text style={styles.note}>Story progress is saved on this device. Daily boundaries currently use UTC.</Text>
  </Card>;
}
const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  copy: { flex: 1 }, overline: { color: colors.textMuted, fontSize: fontSize.xs },
  title: { color: colors.textAccent, fontSize: fontSize.xl, ...typography.heading },
  stage: { color: colors.gold, fontSize: fontSize.md, marginBottom: 10, ...typography.heading },
  body: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 23, marginBottom: 14 },
  label: { color: colors.textPrimary, fontSize: fontSize.sm, marginBottom: 8 },
  input: { backgroundColor: colors.bgInput, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, padding: 12, minHeight: 48, marginBottom: 16, fontSize: fontSize.md },
  progress: { color: colors.textAccent, fontSize: fontSize.sm, marginBottom: 10 },
  track: { height: 8, backgroundColor: colors.bgInput, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  fill: { height: 8, backgroundColor: colors.gold }, action: { marginBottom: 10 },
  note: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18, marginTop: 14 },
});
