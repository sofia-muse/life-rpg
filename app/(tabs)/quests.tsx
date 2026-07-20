import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { QuestCard } from '../../src/components/game/QuestCard';
import { ContractHeader } from '../../src/components/game/ContractHeader';
import { GuildmasterSuggestions } from '../../src/components/game/GuildmasterSuggestions';
import { BossPlannerModal } from '../../src/components/game/BossPlannerModal';
import { XPPopup } from '../../src/components/game/XPPopup';
import { useQuestStore } from '../../src/store/questStore';
import { useHeroStore } from '../../src/store/heroStore';
import { useGameplayStore } from '../../src/store/gameplayStore';
import { useUIStore } from '../../src/store/uiStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { Card } from '../../src/components/layout/Card';
import { colors, spacing, fontSize, radius } from '../../src/config/theme';
import { STAT_COLORS, STAT_ICONS, DIFFICULTY_XP } from '../../src/types';
import { getAllTemplates, QuestTemplate } from '../../src/config/questTemplates';
import { getPrimaryContract } from '../../src/config/classContracts';
import { isQuestContractAligned } from '../../src/config/achievements';
import { getQuestEvolutionState } from '../../src/engine/questProgression';
import { playGameFeedback } from '../../src/utils/gameFeedback';

type Tab = 'daily' | 'side' | 'boss';

export default function QuestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [showBossPlanner, setShowBossPlanner] = useState(false);
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
    setEvolution,
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
  const contract = hero ? getPrimaryContract(hero, settings, quests) : null;
  const existingTitles = useMemo(
    () => new Set(quests.map((q) => q.title)),
    [quests],
  );

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
          const priorQuest = useQuestStore.getState().getQuestById(questId);
          const priorEvolution = priorQuest ? getQuestEvolutionState(priorQuest) : null;

          const result = await completeQuestFlow(questId);
          if (!result) {
            console.warn('[QuestsScreen] Quest completion returned no result.', { questId });
            return;
          }

          if (result.stepAdvancedOnly) {
            void playGameFeedback('bossPhase', settings.hapticEnabled);
            setCharacterEvent('bossPhase');
            setTimeout(() => setCharacterEvent('idle'), 1500);
            return;
          }

          if (!result.completed) return;

          void playGameFeedback('questComplete', settings.hapticEnabled);
          showXP(result.quest.stat, result.xpAwarded);
          setCharacterEvent('questComplete');
          setTimeout(() => setCharacterEvent('idle'), 1500);

          if (priorQuest && priorQuest.title !== result.quest.title && priorEvolution?.nextRankName) {
            setTimeout(() => {
              void playGameFeedback('evolution', settings.hapticEnabled);
              setEvolution(priorEvolution.nextRankName!, result.quest.title);
              setCharacterEvent('evolution');
              setTimeout(() => setCharacterEvent('idle'), 2000);
            }, 800);
          }

          if (result.levelResult) {
            const { stat, newLevel, tierUp } = result.levelResult;
            setTimeout(() => {
              void playGameFeedback('levelUp', settings.hapticEnabled);
              setLevelUp(stat, newLevel);
            }, 1200);

            if (tierUp) {
              setTimeout(() => {
                void playGameFeedback('tierUp', settings.hapticEnabled);
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
          console.error('[QuestsScreen] Failed to complete quest.', { questId, error });
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
      setEvolution,
      settings.hapticEnabled,
    ],
  );

  const filteredQuests = tabQuests[activeTab];

  return (
    <ScreenWrapper showScrollIndicator>
      {showXPPopup && xpPopupData && (
        <XPPopup stat={xpPopupData.stat} amount={xpPopupData.amount} onDone={dismissXP} />
      )}

      <BossPlannerModal
        visible={showBossPlanner}
        onClose={() => setShowBossPlanner(false)}
        defaultStat={hero?.dominantStat}
        onCreateBoss={(plan) =>
          addQuest({
            title: plan.title,
            description: plan.description,
            type: 'boss',
            difficulty: plan.difficulty,
            stat: plan.stat,
            xpReward: DIFFICULTY_XP[plan.difficulty],
            isActive: true,
            totalSteps: plan.totalSteps,
            completedSteps: 0,
          })
        }
      />

      <Text style={styles.title}>Adventures</Text>
      <Text style={styles.subtitle}>Contracts, side ventures, and boss arcs</Text>

      <TouchableOpacity onPress={() => router.push('/raids')} accessibilityRole="button">
        <Card style={styles.raidCallout}>
          <Text style={styles.raidCalloutTitle}>Guild Raid</Text>
          <Text style={styles.raidCalloutBody}>
            Party up with invite codes and pool a huge real-world goal. Registration unlocks co-op.
          </Text>
        </Card>
      </TouchableOpacity>

      {contract && <ContractHeader contract={contract} />}

      <GuildmasterSuggestions onAddQuest={handleAddFromTemplate} existingTitles={existingTitles} />

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

      {activeTab === 'boss' && (
        <TouchableOpacity style={styles.bossPlannerBtn} onPress={() => setShowBossPlanner(true)}>
          <Text style={styles.bossPlannerText}>✨ Forge a Boss Arc</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.suggestionsToggle}
        onPress={() => setShowSuggestions(!showSuggestions)}
      >
        <Text style={styles.suggestionsToggleText}>
          {showSuggestions ? '▼ Hide Suggestions' : '▶ Browse Suggested Quests'}
        </Text>
      </TouchableOpacity>

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
              contractAligned={contract ? isQuestContractAligned(item, contract) : false}
              useFantasyNames={settings.fantasyNames}
            />
          ))
        )}
      </View>

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
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  raidCallout: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderColor: colors.goldSoft,
    borderWidth: 1,
  },
  raidCalloutTitle: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  raidCalloutBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
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
  bossPlannerBtn: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: 'rgba(196, 169, 98, 0.1)',
  },
  bossPlannerText: {
    color: colors.gold,
    fontSize: fontSize.sm,
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
