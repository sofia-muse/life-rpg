import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { SkillNode } from '../../src/components/game/SkillNode';
import { Card } from '../../src/components/layout/Card';
import { useHeroStore } from '../../src/store/heroStore';
import { useSkillStore } from '../../src/store/skillStore';
import { getSkillsByCategory } from '../../src/config/skills';
import { getSkillProgress } from '../../src/engine/skillEngine';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { Skill, STAT_NAMES, STAT_COLORS, STAT_ICONS } from '../../src/types';

export default function SkillsScreen() {
  const { hero } = useHeroStore();
  const { isSkillUnlocked } = useSkillStore();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

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
    <ScreenWrapper>
      <Text style={styles.title}>Skill Trees</Text>
      <Text style={styles.subtitle}>Unlock skills by leveling your stats</Text>

      {categories.map((cat) => {
        const skills = getSkillsByCategory(cat.key);
        if (skills.length === 0) return null;

        return (
          <Card key={cat.key} style={styles.treeCard}>
            <View style={styles.treeHeader}>
              <Text style={styles.treeIcon}>{cat.icon}</Text>
              <Text style={[styles.treeName, { color: cat.color }]}>{cat.label}</Text>
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
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  treeCard: {
    marginBottom: spacing.md,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  treeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  treeName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  nodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
