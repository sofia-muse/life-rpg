import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { SkillNode } from '../../src/components/game/SkillNode';
import { Card } from '../../src/components/layout/Card';
import { Button } from '../../src/components/layout/Button';
import { Badge } from '../../src/components/layout/Badge';
import { useHeroStore } from '../../src/store/heroStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { useForgedSkillStore } from '../../src/store/forgedSkillStore';
import { useUIStore } from '../../src/store/uiStore';
import { getSkillsByCategory } from '../../src/config/skills';
import { getActiveBuildSummary, getSkillProgress } from '../../src/engine/skillEngine';
import { env } from '../../src/config/env';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { Skill, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../src/types';
import { getActiveWeeklyPath, getWeeklyPathDefinition } from '../../src/config/weeklyPaths';

export default function SkillsScreen() {
  const { hero } = useHeroStore();
  const isSkillUnlocked = useSkillStore((s) => s.isSkillUnlocked);
  const getUnlockedSkillIds = useSkillStore((s) => s.getUnlockedSkillIds);
  const settings = useSettingsStore();
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

  const unlockedSkillIds = getUnlockedSkillIds();
  const buildSummary = getActiveBuildSummary(unlockedSkillIds);
  const activePath = getActiveWeeklyPath(settings);
  const activePathDefinition = activePath ? getWeeklyPathDefinition(activePath) : null;
  const topStats = [...STAT_NAMES]
    .sort((left, right) => hero.statXP[right] - hero.statXP[left])
    .slice(0, 2);

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
    <ScreenWrapper>
      <ScreenHeader
        eyebrow="Build Hall"
        title="Skill Trees"
        subtitle="Your routines now shape a build. Track what is active, what is next, and which disciplines define this hero."
      />

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Build Signature</Text>
          <Text style={styles.summaryTitle}>{hero.className}</Text>
          <View style={styles.badgeRow}>
            <Badge label={`Tier ${hero.classTier}`} color={STAT_COLORS[hero.dominantStat]} />
            <Badge label={hero.dominantStat.toUpperCase()} color={STAT_COLORS[hero.dominantStat]} />
            {activePathDefinition ? <Badge label={activePathDefinition.label} color={colors.amethyst} /> : null}
          </View>
          <Text style={styles.summaryText}>
            Leading disciplines: {topStats.map((stat) => stat.charAt(0).toUpperCase() + stat.slice(1)).join(' + ')}.
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Active Perks</Text>
          <Text style={styles.summaryTitle}>{buildSummary.unlockedSkills.length} skills online</Text>
          <View style={styles.perkRow}>
            <View style={styles.perkChip}>
              <Text style={styles.perkValue}>+{buildSummary.totalQuestBonusPercent}%</Text>
              <Text style={styles.perkLabel}>Potential XP bonus</Text>
            </View>
            <View style={styles.perkChip}>
              <Text style={styles.perkValue}>{buildSummary.activeDailyQuestCapacityBonus}</Text>
              <Text style={styles.perkLabel}>Extra daily slots</Text>
            </View>
          </View>
          <Text style={styles.summaryText}>
            {buildSummary.notablePerks.length > 0
              ? buildSummary.notablePerks.slice(0, 2).join(' · ')
              : 'No passive perks unlocked yet. Raise a stat to begin shaping the build.'}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Campaign Support</Text>
          <Text style={styles.summaryTitle}>
            {buildSummary.streakFreezeAllowance > 0 || buildSummary.streakRetentionPercent > 0
              ? 'Momentum protected'
              : 'Momentum building'}
          </Text>
          <Text style={styles.summaryText}>
            Rest ritual: {buildSummary.restDayXpReward} vitality XP. Streak retention:{' '}
            {buildSummary.streakRetentionPercent}%.
          </Text>
          <Text style={styles.summaryText}>
            Weekly freeze allowance: {buildSummary.streakFreezeAllowance}. All-quest bonus:{' '}
            {buildSummary.allQuestBonusPercent}%.
          </Text>
        </Card>
      </View>

      {/* AI-Forged skills (opt-in, online-only) */}
      {aiSkillsEnabled && (
        <Card style={styles.treeCard}>
          <View style={styles.treeHeader}>
            <Text style={styles.treeIcon}>✨</Text>
            <Text style={[styles.treeName, { color: colors.gold }]}>Forged</Text>
          </View>
          {canForge ? (
            <>
              {forged.length > 0 && (
                <View style={styles.nodesRow}>
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
        const unlockedCount = skills.filter((skill) => isSkillUnlocked(skill.id)).length;

        return (
          <Card key={cat.key} style={styles.treeCard}>
            <View style={styles.treeHeader}>
              <View>
                <View style={styles.treeTitleRow}>
                  <Text style={styles.treeIcon}>{cat.icon}</Text>
                  <Text style={[styles.treeName, { color: cat.color }]}>{cat.label}</Text>
                </View>
                <Text style={styles.treeHint}>
                  {unlockedCount}/{skills.length} unlocked
                  {cat.key !== 'cross' ? ` · ${cat.label} levels shape this lane` : ' · hybrid synergies'}
                </Text>
              </View>
            </View>
            <View style={styles.nodesRow}>
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
  summaryGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: 0,
  },
  summaryEyebrow: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  perkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  perkChip: {
    flex: 1,
    minWidth: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgInset,
    padding: spacing.sm,
  },
  perkValue: {
    color: colors.goldBright,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  perkLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  treeCard: {
    marginBottom: spacing.md,
  },
  forgeButton: {
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  treeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  treeName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  treeHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  nodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '85%',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  modalName: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginBottom: spacing.md,
  },
  modalEffect: {
    color: colors.textAccent,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalReq: {
    marginBottom: spacing.md,
  },
  modalReqLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  modalReqText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
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
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
