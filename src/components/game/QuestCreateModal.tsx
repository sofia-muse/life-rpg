import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button } from '../layout/Button';
import { useQuestStore } from '../../store/questStore';
import { useUIStore } from '../../store/uiStore';
import { colors, spacing, fontSize, radius } from '../../config/theme';
import {
  StatName,
  QuestType,
  QuestDifficulty,
  STAT_NAMES,
  STAT_COLORS,
  STAT_ICONS,
  DIFFICULTY_XP,
} from '../../types';

export function QuestCreateModal() {
  const { showQuestCreateModal, setQuestCreateModal } = useUIStore();
  const { addQuest } = useQuestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stat, setStat] = useState<StatName>('strength');
  const [type, setType] = useState<QuestType>('daily');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
  const [totalSteps, setTotalSteps] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setStat('strength');
    setType('daily');
    setDifficulty('medium');
    setTotalSteps('');
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    addQuest({
      title: title.trim(),
      description: description.trim(),
      type,
      difficulty,
      stat,
      xpReward: DIFFICULTY_XP[difficulty],
      isActive: true,
      ...(type === 'boss' && totalSteps
        ? { totalSteps: parseInt(totalSteps, 10), completedSteps: 0 }
        : {}),
    });

    reset();
    setQuestCreateModal(false);
  };

  const difficulties: QuestDifficulty[] = ['easy', 'medium', 'hard', 'legendary'];
  const questTypes: QuestType[] = ['daily', 'side', 'boss'];

  return (
    <Modal
      visible={showQuestCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setQuestCreateModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <Text style={styles.title}>Create Quest</Text>

            {/* Title */}
            <Text style={styles.label}>Quest Name</Text>
            <TextInput
              style={styles.input}
              placeholder="What's the quest?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            {/* Description */}
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Details..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              maxLength={200}
            />

            {/* Quest Type */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {questTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Boss steps */}
            {type === 'boss' && (
              <>
                <Text style={styles.label}>Total Steps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  value={totalSteps}
                  onChangeText={setTotalSteps}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </>
            )}

            {/* Stat */}
            <Text style={styles.label}>Stat</Text>
            <View style={styles.chips}>
              {STAT_NAMES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    stat === s && {
                      borderColor: STAT_COLORS[s],
                      backgroundColor: `${STAT_COLORS[s]}20`,
                    },
                  ]}
                  onPress={() => setStat(s)}
                >
                  <Text style={styles.chipIcon}>{STAT_ICONS[s]}</Text>
                  <Text style={[styles.chipText, stat === s && { color: STAT_COLORS[s] }]}>
                    {s.slice(0, 3).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Difficulty */}
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.chips}>
              {difficulties.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, difficulty === d && styles.chipActive]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                  <Text style={styles.chipXP}>{DIFFICULTY_XP[d]} XP</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  reset();
                  setQuestCreateModal(false);
                }}
              />
              <Button title="Create Quest" onPress={handleCreate} disabled={!title.trim()} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: spacing.sm + 4,
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}20`,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.gold,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipXP: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
