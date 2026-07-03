import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { QuestCard } from '../../src/components/game/QuestCard';
import { XPPopup } from '../../src/components/game/XPPopup';
import { useQuestStore } from '../../src/store/questStore';
import { useHeroStore } from '../../src/store/heroStore';
import { useSkillStore } from '../../src/store/skillStore';
import { useJournalStore } from '../../src/store/journalStore';
import { useUIStore } from '../../src/store/uiStore';
import { Card } from '../../src/components/layout/Card';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP } from '../../src/types';
import { calculateXPReward } from '../../src/engine/xpEngine';
import { getStreakMultiplier } from '../../src/engine/streakEngine';
import { getSkillBonusForQuest } from '../../src/engine/skillEngine';
import { generateQuestNarrative } from '../../src/engine/journalEngine';
import { getAllTemplates, QuestTemplate } from '../../src/config/questTemplates';

type Tab = 'daily' | 'side' | 'boss';

export default function QuestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const {
    quests,
    addQuest,
    completeQuest,
    completeBossStep,
    deleteQuest,
    getDailyQuests,
    getSideQuests,
    getBossQuests,
    resetDailyQuests,
  } = useQuestStore();
  const { hero, addXP, beginDailyActivity, recordQuestCompletion, checkAppearanceUnlocks } =
    useHeroStore();
  const { checkAndUnlockSkills, getUnlockedSkillIds } = useSkillStore();
  const { updateTodayEntry } = useJournalStore();
  const {
    showXP,
    setLevelUp,
    setSkillUnlock,
    setTierUp,
    setQuestCreateModal,
    setAppearanceUnlock,
    setCharacterEvent,
    showXPPopup,
    xpPopupData,
    dismissXP,
  } = useUIStore();

  const tabQuests = {
    daily: getDailyQuests(),
    side: getSideQuests(),
    boss: getBossQuests(),
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddFromTemplate = useCallback(
    (template: QuestTemplate) => {
      addQuest({
        title: template.title,
        description: template.description,
        type: template.type,
        difficulty: template.difficulty,
        stat: template.stat,
        xpReward: DIFFICULTY_XP[template.difficulty],
        isActive: true,
        ...(template.type === 'boss' && template.totalSteps
          ? { totalSteps: template.totalSteps, completedSteps: 0 }
          : {}),
      });
    },
    [addQuest],
  );

  const handleComplete = useCallback(
    (questId: string) => {
      if (!hero) return;

      resetDailyQuests();

      const currentQuest = useQuestStore.getState().quests.find((item) => item.id === questId);
      if (!currentQuest) return;

      const quest =
        currentQuest.type === 'boss' && currentQuest.totalSteps
          ? completeBossStep(questId)
          : completeQuest(questId);
      if (!quest) return;
      if (!quest.isCompleted) return;

      const unlockedSkillIds = getUnlockedSkillIds();
      const streak = beginDailyActivity({
        hasRegenerationSkill: unlockedSkillIds.includes('vit-2'),
        hasUnbreakableSkill: unlockedSkillIds.includes('wil-2'),
      });
      if (streak === null) return;

      // Calculate XP
      const streakMult = getStreakMultiplier(streak);
      const skillBonus = getSkillBonusForQuest(
        { stat: quest.stat, type: quest.type },
        unlockedSkillIds,
      );
      const xpReward = calculateXPReward(quest.difficulty, streakMult, skillBonus);

      // Apply XP
      const levelResult = addXP(quest.stat, xpReward.totalXP);
      recordQuestCompletion();

      // Show XP popup
      showXP(quest.stat, xpReward.totalXP);

      // Trigger character celebration
      setCharacterEvent('questComplete');
      setTimeout(() => setCharacterEvent('idle'), 1500);

      // Check level up
      if (levelResult) {
        setTimeout(() => {
          setLevelUp(levelResult.stat, levelResult.newLevel);
        }, 1200);

        // Check tier up
        if (levelResult.tierUp) {
          setTimeout(() => {
            setTierUp(levelResult.tierUp!.newTier, levelResult.tierUp!.newClass);
          }, 2500);
        }
      }

      // Check skill unlocks
      const updatedHero = useHeroStore.getState().hero;
      if (updatedHero) {
        const newSkills = checkAndUnlockSkills(updatedHero.statXP);
        if (newSkills.length > 0) {
          setTimeout(() => {
            setSkillUnlock(newSkills[0]);
          }, levelResult ? 3000 : 1200);
        }
      }

      // Check appearance unlocks
      const appearanceResult = checkAppearanceUnlocks();
      if (appearanceResult) {
        const delay = levelResult ? 4000 : 2000;
        if (appearanceResult.shapes.length > 0) {
          setTimeout(() => setAppearanceUnlock('shape', appearanceResult.shapes[0]), delay);
        } else if (appearanceResult.sigils.length > 0) {
          setTimeout(() => setAppearanceUnlock('sigil', appearanceResult.sigils[0]), delay);
        }
      }

      // Update journal
      const narrative = generateQuestNarrative(quest);
      updateTodayEntry({
        narrative,
        questsCompleted: [quest.id],
        xpGained: {
          ...{ strength: 0, vitality: 0, intelligence: 0, charisma: 0, dexterity: 0, willpower: 0 },
          [quest.stat]: xpReward.totalXP,
        },
      });
    },
    [
      hero,
      completeQuest,
      completeBossStep,
      resetDailyQuests,
      getUnlockedSkillIds,
      beginDailyActivity,
      addXP,
      recordQuestCompletion,
      checkAndUnlockSkills,
      checkAppearanceUnlocks,
      showXP,
      setCharacterEvent,
      setLevelUp,
      setTierUp,
      setSkillUnlock,
      setAppearanceUnlock,
      updateTodayEntry,
    ],
  );

  const filteredQuests = tabQuests[activeTab];

  return (
    <ScreenWrapper scroll={false}>
      {showXPPopup && xpPopupData && (
        <XPPopup stat={xpPopupData.stat} amount={xpPopupData.amount} onDone={dismissXP} />
      )}

      <Text style={styles.title}>Quests</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['daily', 'side', 'boss'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            <View style={styles.tabCount}>
              <Text style={styles.tabCountText}>{tabQuests[tab].length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Suggestions toggle */}
      <TouchableOpacity
        style={styles.suggestionsToggle}
        onPress={() => setShowSuggestions(!showSuggestions)}
      >
        <Text style={styles.suggestionsToggleText}>
          {showSuggestions ? '▼ Hide Suggestions' : '▶ Browse Suggested Quests'}
        </Text>
      </TouchableOpacity>

      {/* Suggested Quests */}
      {showSuggestions && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>
            Suggested {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Quests
          </Text>
          {getAllTemplates(activeTab, undefined, hero?.characterAppearance?.gender)
            .filter((t) => !quests.some((q) => q.title === t.title && q.type === t.type))
            .slice(0, 6)
            .map((template, i) => (
              <Card key={`${template.title}-${i}`} style={styles.suggestionCard}>
                <View style={styles.suggestionContent}>
                  <View style={styles.suggestionInfo}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionIcon}>{STAT_ICONS[template.stat]}</Text>
                      <Text style={styles.suggestionTitle}>{template.title}</Text>
                    </View>
                    <Text style={styles.suggestionDesc} numberOfLines={1}>
                      {template.description}
                    </Text>
                    <View style={styles.suggestionMeta}>
                      <Text style={[styles.suggestionDiff, { color: STAT_COLORS[template.stat] }]}>
                        {template.difficulty} · {DIFFICULTY_XP[template.difficulty]} XP
                      </Text>
                      {template.totalSteps && (
                        <Text style={styles.suggestionSteps}>{template.totalSteps} steps</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddFromTemplate(template)}
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
        </View>
      )}

      {/* Quest List */}
      <FlatList
        data={filteredQuests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuestCard quest={item} onComplete={handleComplete} onDelete={deleteQuest} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No {activeTab} quests yet.</Text>
            <Text style={styles.emptyHint}>
              {showSuggestions
                ? 'Pick one from above or tap + to create your own!'
                : 'Browse suggestions above or tap + to create one!'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setQuestCreateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: '900',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.bgPrimary,
  },
  tabCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  suggestionsToggle: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  suggestionsToggleText: {
    color: colors.textAccent,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  suggestions: {
    marginBottom: spacing.md,
  },
  suggestionsTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    marginBottom: spacing.xs,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestionIcon: {
    fontSize: 14,
  },
  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  suggestionDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  suggestionMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  suggestionDiff: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  suggestionSteps: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  addBtnText: {
    color: colors.bgPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: -1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: colors.bgPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },
});
