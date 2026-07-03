import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { PageHeader } from '../../src/components/layout/PageHeader';
import { SkillNode } from '../../src/components/game/SkillNode';
import { Card } from '../../src/components/layout/Card';
import { Button } from '../../src/components/layout/Button';
import { useHeroStore } from '../../src/store/heroStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { useForgedSkillStore } from '../../src/store/forgedSkillStore';
import { useUIStore } from '../../src/store/uiStore';
import { getSkillsByCategory } from '../../src/config/skills';
import { getSkillProgress } from '../../src/engine/skillEngine';
import { env } from '../../src/config/env';
import { colors, spacing, fontSize, radius, typography } from '../../src/config/theme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Skill, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../src/types';

export default function SkillsScreen() {
  const { isDesktop } = useResponsive();
  const { hero } = useHeroStore();
  const { isSkillUnlocked } = useSkillStore();
  const aiSkillsEnabled = useSettingsStore((s) => s.aiSkillsEnabled);
  const authenticated = useAuthStore((s) => s.status === 'authenticated');
  const { forged, loading: forging, load: loadForged, forge } = useForgedSkillStore();
  const setSkillUnlock = useUIStore((s) => s.setSkillUnlock);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // The forge feature is online-only (needs the backend + key).
  const canForge = aiSkillsEnabled && !env.demoMode && authenticated;

  useEffect(() => {
    if (canForge) void loadForged();
  }, [canForge, loadForged]);

  const handleForge = async () => {
    const skill = await forge();
    if (skill) setSkillUnlock(skill);
  };

  if (!hero) return null;

  const categories: { key: string; label: string; color: string; icon: string }[] = [
    ...STAT_NAMES.map((stat) => ({
      key: stat,
      label: stat.charAt(0).toUpperCase() + stat.slice(1),
      color: STAT_COLORS[stat],
      icon: STAT_ICONS[stat],
    })),
    { key: 'cross', label: 'Cross-Stat', color: colors.gold, icon: '⚡' },
  ];

  return (
    <ScreenWrapper contentWidth="wide">
      <PageHeader
        eyebrow="Ascension Paths"
        title="Skill Trees"
        subtitle="Unlock enduring bonuses as your stats mature. Each path reflects how your real-life habits are shaping your class."
      />

      {/* AI-Forged skills (opt-in, online-only) */}
      {aiSkillsEnabled && (
        <Card style={styles.treeCard} accentColor={colors.gold}>
          <View style={styles.treeHeader}>
            <Text style={styles.treeIcon}>✨</Text>
            <View style={styles.treeHeaderCopy}>
              <Text style={[styles.treeEyebrow, { color: colors.gold }]}>Rare boon</Text>
              <Text style={[styles.treeName, { color: colors.gold }]}>Forged</Text>
            </View>
          </View>
          {canForge ? (
            <>
              {forged.length > 0 && (
                <View style={[styles.nodesRow, isDesktop && styles.nodesRowWide]}>
                  {forged.map((skill) => (
                    <SkillNode
                      key={skill.id}
                      skill={skill}
                      isUnlocked
                      progress={1}
                      onPress={setSelectedSkill}
                    />
                  ))}
                </View>
              )}
              <Button
                title={forging ? 'Forging…' : '✨ Forge a Skill'}
                onPress={handleForge}
                loading={forging}
                variant="secondary"
                style={styles.forgeButton}
              />
            </>
          ) : (
            <Text style={styles.hint}>
              Sign in (with demo mode off) to forge unique AI-generated skills for your hero.
            </Text>
          )}
        </Card>
      )}

      {categories.map((cat) => {
        const skills = getSkillsByCategory(cat.key);
        if (skills.length === 0) return null;

        return (
          <Card key={cat.key} style={styles.treeCard} accentColor={cat.color}>
            <View style={styles.treeHeader}>
              <Text style={styles.treeIcon}>{cat.icon}</Text>
              <View style={styles.treeHeaderCopy}>
                <Text style={[styles.treeEyebrow, { color: cat.color }]}>Discipline path</Text>
                <Text style={[styles.treeName, { color: cat.color }]}>{cat.label}</Text>
              </View>
            </View>
            <View style={[styles.nodesRow, isDesktop && styles.nodesRowWide]}>
              {skills.map((skill) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  isUnlocked={isSkillUnlocked(skill.id)}
                  progress={getSkillProgress(skill, hero.statXP)}
                  onPress={setSelectedSkill}
                />
              ))}
            </View>
          </Card>
        );
      })}

      {/* Skill Detail Modal */}
      <Modal
        visible={!!selectedSkill}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSkill(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedSkill(null)}
        >
          <View style={styles.modalContent}>
            {selectedSkill && (
              <>
                <Text style={styles.modalIcon}>{selectedSkill.icon}</Text>
                <Text style={styles.modalName}>{selectedSkill.name}</Text>
                <Text style={styles.modalDesc}>{selectedSkill.description}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalEffect}>{selectedSkill.effect}</Text>
                <View style={styles.modalReq}>
                  <Text style={styles.modalReqLabel}>Requires:</Text>
                  <Text style={styles.modalReqText}>
                    {selectedSkill.requiredStat
                      ? `${selectedSkill.requiredStat.charAt(0).toUpperCase() + selectedSkill.requiredStat.slice(1)} Lv. ${selectedSkill.requiredLevel}`
                      : 'Unknown'}
                    {selectedSkill.secondaryStat
                      ? ` + ${selectedSkill.secondaryStat.charAt(0).toUpperCase() + selectedSkill.secondaryStat.slice(1)} Lv. ${selectedSkill.secondaryLevel}`
                      : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.modalStatus,
                    isSkillUnlocked(selectedSkill.id) ? styles.modalUnlocked : styles.modalLocked,
                  ]}
                >
                  <Text style={styles.modalStatusText}>
                    {isSkillUnlocked(selectedSkill.id) ? '✓ Unlocked' : '🔒 Locked'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  treeCard: {
    marginBottom: spacing.md,
  },
  forgeButton: {
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  treeIcon: {
    fontSize: 22,
  },
  treeHeaderCopy: {
    flex: 1,
  },
  treeEyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.xxs,
  },
  treeName: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  nodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  nodesRowWide: {
    gap: spacing.xs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  modalName: {
    ...typography.pageTitle,
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalDesc: {
    ...typography.journalItalic,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginBottom: spacing.md,
  },
  modalEffect: {
    ...typography.bodyStrong,
    color: colors.textAccent,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalReq: {
    marginBottom: spacing.md,
  },
  modalReqLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalReqText: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalStatus: {
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  modalUnlocked: {
    backgroundColor: `${colors.success}20`,
  },
  modalLocked: {
    backgroundColor: `${colors.error}20`,
  },
  modalStatusText: {
    ...typography.eyebrow,
    color: colors.textPrimary,
  },
});
