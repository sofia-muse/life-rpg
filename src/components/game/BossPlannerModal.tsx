import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize, radius, typography } from '../../config/theme';
import { guidanceApi } from '../../api/guidanceApi';
import { STAT_NAMES, STAT_ICONS, StatName } from '../../types';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../layout/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateBoss: (plan: {
    title: string;
    description: string;
    stat: StatName;
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    totalSteps: number;
  }) => void;
  defaultStat?: StatName;
}

export function BossPlannerModal({ visible, onClose, onCreateBoss, defaultStat }: Props) {
  const [goal, setGoal] = useState('');
  const [stat, setStat] = useState<StatName>(defaultStat ?? 'strength');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<{
    sagaTitle: string;
    title: string;
    description: string;
    totalSteps: number;
    steps: string[];
    rewardTitle: string;
  } | null>(null);
  const aiSkillsEnabled = useSettingsStore((s) => s.aiSkillsEnabled);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const canUseGuidance = aiSkillsEnabled && !env.demoMode && authenticated;

  const handlePlan = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await guidanceApi.planBossQuest(goal.trim(), stat);
      setPlanPreview(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Boss planning failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!planPreview) return;
    onCreateBoss({
      title: planPreview.title,
      description: `${planPreview.sagaTitle}: ${planPreview.description}`,
      stat,
      difficulty: 'hard',
      totalSteps: planPreview.totalSteps,
    });
    setGoal('');
    setPlanPreview(null);
    onClose();
  };

  const handleClose = () => {
    setGoal('');
    setPlanPreview(null);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Forge a Boss Arc</Text>
          <Text style={styles.subtitle}>
            Describe a real goal. The Guildmaster will shape it into a multi-step saga.
          </Text>

          {!canUseGuidance ? (
            <Text style={styles.offline}>
              Boss planning requires sign-in with AI guidance enabled. In demo mode, add boss quests from templates.
            </Text>
          ) : (
            <ScrollView style={styles.scroll}>
              <TextInput
                style={styles.input}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. Run a half marathon in 3 months"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={styles.label}>Primary stat</Text>
              <View style={styles.statRow}>
                {STAT_NAMES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statChip, stat === s && styles.statChipActive]}
                    onPress={() => setStat(s)}
                  >
                    <Text style={styles.statChipText}>{STAT_ICONS[s]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              {planPreview && (
                <View style={styles.preview}>
                  <Text style={styles.sagaTitle}>{planPreview.sagaTitle}</Text>
                  <Text style={styles.planTitle}>{planPreview.title}</Text>
                  <Text style={styles.planDesc}>{planPreview.description}</Text>
                  <Text style={styles.reward}>Reward: {planPreview.rewardTitle}</Text>
                  <Text style={styles.stepsLabel}>{planPreview.totalSteps} phases:</Text>
                  {planPreview.steps.map((step, i) => (
                    <Text key={i} style={styles.step}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={handleClose} style={styles.actionBtn} />
            {canUseGuidance && !planPreview && (
              <Button
                title={loading ? 'Forging…' : 'Plan Saga'}
                onPress={() => void handlePlan()}
                style={styles.actionBtn}
              />
            )}
            {planPreview && (
              <Button title="Begin Arc" onPress={handleCreate} style={styles.actionBtn} />
            )}
          </View>

          {loading && <ActivityIndicator color={colors.gold} style={styles.loader} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginBottom: spacing.xs,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  offline: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  scroll: { maxHeight: 360 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: 80,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
  },
  statChipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(196, 169, 98, 0.2)',
  },
  statChipText: { fontSize: 18 },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.sm },
  preview: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgInset,
    marginBottom: spacing.md,
  },
  sagaTitle: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  planDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  reward: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  stepsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  step: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: { flex: 1 },
  loader: { marginTop: spacing.sm },
});
