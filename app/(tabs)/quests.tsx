import { RPGIcon } from '../../src/components/game/RPGIcon';
import { useCompletionStore } from '../../src/store/completionStore';
import { FantasyIcon } from '../../src/components/game/FantasyIcon';
import { StoryHeader } from '../../src/components/layout/StoryHeader';
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
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
import { STAT_COLORS, STAT_NAMES, StatName, DIFFICULTY_XP } from '../../src/types';
import { filterQuests, QuestStatus } from '../../src/utils/questFilters';
import { getAllTemplates, QuestTemplate } from '../../src/config/questTemplates';
import { getPrimaryContract } from '../../src/config/classContracts';
import { isQuestContractAligned } from '../../src/config/achievements';
import { resolveEvolutionPathId } from '../../src/engine/questProgression';
import { isDifficultyAllowed, getWeeklyCapacityBonus, getActiveDailyQuestCapacityBonus } from '../../src/engine/skillEngine';
import { useSkillStore } from '../../src/store/skillStore';
import { presentQuestCompletionFeedback } from '../../src/utils/questCompletionFeedback';

type Tab = 'daily' | 'side' | 'boss';

export default function QuestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [query, setQuery] = useState('');
  const [statFilter, setStatFilter] = useState<StatName | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<QuestStatus>('all');
  const clearFilters = () => {
    setQuery('');
    setStatFilter('all');
    setStatusFilter('all');
  };
  const [showBossPlanner, setShowBossPlanner] = useState(false);
  const { quests, addQuest, deleteQuest, getDailyQuests, getSideQuests, getBossQuests } =
    useQuestStore();
  const hero = useHeroStore((state) => state.hero);
  const completions = useCompletionStore((s) => s.events);
  const settings = useSettingsStore();
  const completeQuestFlow = useGameplayStore((state) => state.completeQuest);
  const unlockedSkills = useSkillStore((s) => s.unlockedSkills);
  const unlockedSkillIds = unlockedSkills.map((s) => s.skillId);
  const { setQuestCreateModal, showXPPopup, xpPopupData, dismissXP } = useUIStore();

  const tabQuests = {
    daily: getDailyQuests(),
    side: getSideQuests(),
    boss: getBossQuests(),
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const contract = hero
    ? getPrimaryContract(hero, settings, quests, getWeeklyCapacityBonus(unlockedSkillIds), completions)
    : null;
  const existingTitles = useMemo(() => new Set(quests.map((q) => q.title)), [quests]);

  const handleAddFromTemplate = useCallback(
    (template: QuestTemplate) => {
      const skillIds = unlockedSkills.map((skill) => skill.skillId);
      if (!isDifficultyAllowed(template.difficulty, template.stat, skillIds)) {
        return;
      }
      addQuest({
        title: template.title,
        description: template.description,
        type: template.type,
        difficulty: template.difficulty,
        stat: template.stat,
        xpReward: DIFFICULTY_XP[template.difficulty],
        isActive: true,
        evolutionPathId: resolveEvolutionPathId(template.title),
        templateTitle: template.title,
        ...(template.type === 'boss' && template.totalSteps
          ? { totalSteps: template.totalSteps, completedSteps: 0 }
          : {}),
      });
    },
    [addQuest, unlockedSkills],
  );

  const handleComplete = useCallback(
    (questId: string) => {
      void (async () => {
        try {
          const priorQuest = useQuestStore.getState().getQuestById(questId);
          const result = await completeQuestFlow(questId);
          if (!result) {
            console.warn('[QuestsScreen] Quest completion returned no result.', { questId });
            return;
          }
          presentQuestCompletionFeedback(priorQuest, result);
        } catch (error) {
          console.error('[QuestsScreen] Failed to complete quest.', { questId, error });
        }
      })();
    },
    [completeQuestFlow],
  );

  const currentQuests = tabQuests[activeTab];
  const filteredQuests = filterQuests(
    currentQuests,
    query,
    statFilter,
    statusFilter,
    settings.fantasyNames,
  );
  const completedCount = currentQuests.filter((quest) => quest.isCompleted).length;
  const hasFilters = query.trim() !== '' || statFilter !== 'all' || statusFilter !== 'all';

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

      <StoryHeader
        chapter="Chapter II · The quest board"
        title="Adventures"
        subtitle="Choose a small quest. Grow your legend."
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setQuestCreateModal(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create a quest"
      >
        <Text style={styles.createButtonText}>+ Create a quest</Text>
      </TouchableOpacity>

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
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
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

      <Card style={styles.questTools}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            {activeTab === 'daily' ? "Today's progress" : 'Quest progress'}
          </Text>
          <Text style={styles.progressCount}>
            {completedCount} / {currentQuests.length} complete
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Quest completion"
          accessibilityValue={{
            min: 0,
            max: Math.max(currentQuests.length, 1),
            now: completedCount,
          }}
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${currentQuests.length ? (completedCount / currentQuests.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your quests…"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Search your quests"
          style={styles.searchInput}
          autoCorrect={false}
        />
        <View style={styles.filterRow}>
          {(['all', 'ready', 'completed', 'paused'] as QuestStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              accessibilityRole="button"
              accessibilityState={{ selected: statusFilter === status }}
              style={[styles.filterChip, statusFilter === status && styles.filterSelected]}
            >
              <Text
                style={[styles.filterText, statusFilter === status && styles.filterTextSelected]}
              >
                {status === 'all'
                  ? 'All quests'
                  : status === 'ready'
                    ? 'Ready to do'
                    : status === 'completed'
                      ? 'Completed'
                      : 'Paused'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterRow}>
          {(['all', ...STAT_NAMES] as (StatName | 'all')[]).map((stat) => (
            <TouchableOpacity
              key={stat}
              onPress={() => setStatFilter(stat)}
              accessibilityRole="button"
              accessibilityLabel={stat === 'all' ? 'All stats' : stat}
              accessibilityState={{ selected: statFilter === stat }}
              style={[styles.filterChip, statFilter === stat && styles.filterSelected]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {stat !== 'all' && <FantasyIcon stat={stat} size={24} />}
                <Text style={[styles.filterText, statFilter === stat && styles.filterTextSelected]}>
                  {stat === 'all' ? 'All stats' : `${stat.charAt(0).toUpperCase() + stat.slice(1)}`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {hasFilters && (
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>
              {filteredQuests.length} of {currentQuests.length} quests
            </Text>
            <TouchableOpacity onPress={clearFilters} accessibilityRole="button">
              <Text style={styles.suggestionsToggleText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {activeTab === 'boss' && (
        <TouchableOpacity style={styles.bossPlannerBtn} onPress={() => setShowBossPlanner(true)}>
          <Text style={styles.bossPlannerText}>Forge a Boss Arc</Text>
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
                      <FantasyIcon stat={template.stat} size={32} />
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
            <RPGIcon name="scroll" size={64} style={{ marginBottom: 14 }} />
            <Text style={styles.emptyText}>
              {hasFilters ? 'No matching quests' : `No ${activeTab} quests yet.`}
            </Text>
            <Text style={styles.emptyHint}>
              {hasFilters
                ? 'Try another search or clear your filters.'
                : showSuggestions
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
              onToggleActive={(id) => useQuestStore.getState().toggleQuestActive(id)}
              resumeDisabled={quests.filter((q) => q.type === 'daily' && q.isActive).length >= 3 + getActiveDailyQuestCapacityBonus(unlockedSkillIds)}
              contractAligned={contract ? isQuestContractAligned(item, contract) : false}
              useFantasyNames={settings.fantasyNames}
            />
          ))
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  createButton: {
    minHeight: 48,
    padding: 12,
    alignSelf: 'flex-end',
    borderRadius: 12,
    backgroundColor: colors.gold,
    marginBottom: 16,
  },
  createButtonText: { color: colors.bgCanvas, fontSize: 16, fontWeight: '700' },
  questTools: { marginBottom: spacing.md, gap: spacing.sm },
  progressHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressTitle: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  progressCount: { color: colors.textSecondary, fontSize: fontSize.sm },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgInset,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.full },
  searchInput: {
    color: colors.textPrimary,
    backgroundColor: colors.bgInput,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 44,
    fontSize: fontSize.sm,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterSelected: { backgroundColor: colors.goldGlow, borderColor: colors.gold },
  filterText: { color: colors.textSecondary, fontSize: fontSize.xs },
  filterTextSelected: { color: colors.goldBright },
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
