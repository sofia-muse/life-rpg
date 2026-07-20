import React, { useState, useEffect } from 'react';
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
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
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
import { guidanceApi } from '../../api/guidanceApi';
import { env } from '../../config/env';
import { useSkillStore } from '../../store/skillStore';
import { isDifficultyAllowed } from '../../engine/skillEngine';

export function QuestCreateModal() {
  const { showQuestCreateModal, setQuestCreateModal } = useUIStore();
  const { addQuest } = useQuestStore();
  const aiSkillsEnabled = useSettingsStore((s) => s.aiSkillsEnabled);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const unlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stat, setStat] = useState<StatName>('strength');
  const [type, setType] = useState<QuestType>('daily');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
  const [totalSteps, setTotalSteps] = useState('');
  const [bossSteps, setBossSteps] = useState<string[]>([]);
  const [bossSagaTitle, setBossSagaTitle] = useState('');
  const [bossRewardTitle, setBossRewardTitle] = useState('');
  const [planningBoss, setPlanningBoss] = useState(false);
  const [bossPlanError, setBossPlanError] = useState<string | null>(null);
  const canUseBossPlanner = aiSkillsEnabled && !env.demoMode && authenticated;

  useEffect(() => {
    if (!isDifficultyAllowed(difficulty, stat, unlockedSkillIds)) {
      setDifficulty('medium');
    }
  }, [stat, difficulty, unlockedSkillIds]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setStat('strength');
    setType('daily');
    setDifficulty('medium');
    setTotalSteps('');
    setBossSteps([]);
    setBossSagaTitle('');
    setBossRewardTitle('');
    setBossPlanError(null);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    if (!isDifficultyAllowed(difficulty, stat, unlockedSkillIds)) return;

    const chapters =
      type === 'boss' && bossSteps.length > 0
        ? `Chapters:\n${bossSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
        : '';
    const sagaMeta =
      type === 'boss'
        ? [bossSagaTitle ? `Saga: ${bossSagaTitle}` : '', bossRewardTitle ? `Reward: ${bossRewardTitle}` : '']
            .filter(Boolean)
            .join('\n')
        : '';
    const finalDescription = [description.trim(), sagaMeta, chapters].filter(Boolean).join('\n\n');

    addQuest({
      title: title.trim(),
      description: finalDescription,
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

  const handleForgeBossPlan = async () => {
    const goal = title.trim() || description.trim();
    if (!goal) {
      setBossPlanError('Give the boss quest a goal first.');
      return;
    }

    setPlanningBoss(true);
    setBossPlanError(null);

    try {
      const plan = await guidanceApi.planBossQuest(goal, stat);
      setTitle(plan.title);
      setDescription(plan.description);
      setDifficulty(plan.difficulty);
      setStat(plan.stat);
      setTotalSteps(String(plan.totalSteps));
      setBossSteps(plan.steps);
      setBossSagaTitle(plan.sagaTitle);
      setBossRewardTitle(plan.rewardTitle);
    } catch (error) {
      setBossPlanError(error instanceof Error ? error.message : 'Boss planning failed');
    } finally {
      setPlanningBoss(false);
    }
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
                {canUseBossPlanner && (
                  <View style={styles.bossPlanner}>
                    <Button
                      title={planningBoss ? 'Forging Saga…' : 'Forge Boss Saga'}
                      onPress={handleForgeBossPlan}
                      loading={planningBoss}
                      variant="secondary"
                    />
                    <Text style={styles.bossPlannerHint}>
                      Use AI to break a real-world goal into a campaign with concrete steps.
                    </Text>
                    {bossPlanError && <Text style={styles.errorText}>{bossPlanError}</Text>}
                    {bossSagaTitle ? (
                      <View style={styles.planPreview}>
                        <Text style={styles.planTitle}>{bossSagaTitle}</Text>
                        {bossRewardTitle ? (
                          <Text style={styles.planReward}>Reward: {bossRewardTitle}</Text>
                        ) : null}
                        {bossSteps.map((step, index) => (
                          <Text key={`${step}-${index}`} style={styles.planStep}>
                            {index + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )}
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
              {difficulties.map((d) => {
                const allowed = isDifficultyAllowed(d, stat, unlockedSkillIds);
                const isActive = difficulty === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                      !allowed && styles.chipLocked,
                    ]}
                    onPress={() => {
                      if (!allowed) return;
                      setDifficulty(d);
                    }}
                    disabled={!allowed}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                        !allowed && styles.chipTextLocked,
                      ]}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                      {!allowed ? ' 🔒' : ''}
                    </Text>
                    <Text style={styles.chipXP}>{DIFFICULTY_XP[d]} XP</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {(difficulty === 'hard' || difficulty === 'legendary') &&
              !isDifficultyAllowed(difficulty, stat, unlockedSkillIds) && (
                <Text style={styles.lockHint}>
                  Unlock this difficulty by raising {stat} skills (L7 for Hard, L15 for Legendary).
                </Text>
              )}

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
              <Button title="Create Quest" onPress={handleCreate} disabled={!title.trim() || !isDifficultyAllowed(difficulty, stat, unlockedSkillIds)} />
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
  chipLocked: {
    opacity: 0.45,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.gold,
  },
  chipTextLocked: {
    color: colors.textMuted,
  },
  lockHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
  bossPlanner: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  bossPlannerHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  planPreview: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  planTitle: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  planReward: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  planStep: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
  },
});
