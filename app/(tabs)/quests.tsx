import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { QuestCard } from '../../src/components/game/QuestCard';
import { XPPopup } from '../../src/components/game/XPPopup';
import { useQuestStore } from '../../src/store/questStore';
import { useHeroStore } from '../../src/store/heroStore';
import { useGameplayStore } from '../../src/store/gameplayStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUIStore } from '../../src/store/uiStore';
import { Card } from '../../src/components/layout/Card';
import { WeeklyContractPanel } from '../../src/components/game/WeeklyContractPanel';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP } from '../../src/types';
import { getAllTemplates, QuestTemplate } from '../../src/config/questTemplates';
import { getPrimaryContract } from '../../src/config/classContracts';
import { getActiveWeeklyPath, isQuestAlignedToWeeklyPath } from '../../src/config/weeklyPaths';

type Tab = 'daily' | 'side' | 'boss';

export default function QuestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const {
    quests,
    addQuest,
    deleteQuest,
    getDailyQuests,
    getSideQuests,
    getBossQuests,
  } = useQuestStore();
  const hero = useHeroStore((state) => state.hero);
  const settings = useSettingsStore();
  const completeQuestFlow = useGameplayStore((state) => state.completeQuest);
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
  const activeWeeklyPath = getActiveWeeklyPath(settings);
  const contract = hero ? getPrimaryContract(hero, settings, quests) : null;
  const contractTitles = new Set(contract?.recommended.map((template) => template.title) ?? []);

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
      void (async () => {
        try {
          const result = await completeQuestFlow(questId);
          if (!result) {
            console.warn('[QuestsScreen] Quest completion returned no result.', {
              questId,
            });
            return;
          }

          if (result.stepAdvancedOnly || !result.completed) {
            return;
          }

          showXP(result.quest.stat, result.xpAwarded);

          setCharacterEvent('questComplete');
          setTimeout(() => setCharacterEvent('idle'), 1500);

          if (result.levelResult) {
            const { stat, newLevel, tierUp } = result.levelResult;
            setTimeout(() => {
              setLevelUp(stat, newLevel);
            }, 1200);

            if (tierUp) {
              setTimeout(() => {
                setTierUp(tierUp.newTier, tierUp.newClass);
              }, 2500);
            }
          }

          if (result.newSkills.length > 0) {
            setTimeout(() => {
              setSkillUnlock(result.newSkills[0]);
            }, result.levelResult ? 3000 : 1200);
          }

          if (result.appearanceUnlock) {
            const { shapes, sigils } = result.appearanceUnlock;
            const delay = result.levelResult ? 4000 : 2000;
            if (shapes.length > 0) {
              setTimeout(() => setAppearanceUnlock('shape', shapes[0]), delay);
            } else if (sigils.length > 0) {
              setTimeout(() => setAppearanceUnlock('sigil', sigils[0]), delay);
            }
          }
        } catch (error) {
          console.error('[QuestsScreen] Failed to complete quest.', {
            questId,
            error,
          });
        }
      })();
    },
    [
      completeQuestFlow,
      showXP,
      setCharacterEvent,
      setLevelUp,
      setTierUp,
      setSkillUnlock,
      setAppearanceUnlock,
    ],
  );

  const filteredQuests = tabQuests[activeTab];
  const suggestedTemplates = getAllTemplates(activeTab, undefined, hero?.characterAppearance?.gender)
    .filter((t) => !quests.some((q) => q.title === t.title && q.type === t.type))
    .sort((left, right) => Number(contractTitles.has(right.title)) - Number(contractTitles.has(left.title)))
    .slice(0, 6);
  const boardCopy = {
    daily: 'Small rituals that keep momentum alive and feed the weekly contract.',
    side: 'Focused contracts for sharper wins, cleaner pivots, and meaningful progress.',
    boss: 'Long-form sagas with phases, pressure, and a clear reward line.',
  }[activeTab];
  const activeCount = filteredQuests.filter((quest) => quest.isActive && !quest.isCompleted).length;

  return (
    <ScreenWrapper showScrollIndicator>
      {showXPPopup && xpPopupData && (
        <XPPopup stat={xpPopupData.stat} amount={xpPopupData.amount} onDone={dismissXP} />
      )}

      <ScreenHeader
        eyebrow="Mission Board"
        title="Quests"
        subtitle="Choose the next rite, contract, or saga and let the board push the journey forward."
      />

      <WeeklyContractPanel />

      <Card style={styles.boardCard}>
        <Text style={styles.boardTitle}>
          {activeTab === 'daily' ? 'Daily Rites' : activeTab === 'side' ? 'Side Contracts' : 'Boss Sagas'}
        </Text>
        <Text style={styles.boardText}>{boardCopy}</Text>
        <Text style={styles.boardMeta}>
          {activeCount} active on the board · {filteredQuests.length} total in this lane
        </Text>
      </Card>

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
          {suggestedTemplates.map((template, i) => (
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
                      {contractTitles.has(template.title) && <Text style={styles.contractTag}>contract-aligned</Text>}
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
      <View style={styles.list}>
        {filteredQuests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No {activeTab} quests yet.</Text>
            <Text style={styles.emptyHint}>
              {showSuggestions
                ? 'Pick one from above or tap + to create your own!'
                : 'Browse suggestions above or tap + to create one!'}
            </Text>
          </View>
        ) : (
          filteredQuests.map((item) => (
            <QuestCard
              key={item.id}
              quest={item}
              onComplete={handleComplete}
              onDelete={deleteQuest}
              highlighted={
                contractTitles.has(item.title) ||
                (activeWeeklyPath ? isQuestAlignedToWeeklyPath(activeWeeklyPath, item) : false)
              }
            />
          ))
        )}
      </View>

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
  boardCard: {
    marginBottom: spacing.md,
  },
  boardTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  boardText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  boardMeta: {
    color: colors.textAccent,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
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
    minWidth: 0,
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
    minWidth: 0,
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
    flexWrap: 'wrap',
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
  contractTag: {
    color: colors.goldBright,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
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
