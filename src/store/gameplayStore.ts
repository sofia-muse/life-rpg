import { create } from 'zustand';
import { applyApiHeroSnapshot } from '../api/applyApiHeroSnapshot';
import { ApiError } from '../api/client';
import { mapApiQuest } from '../api/mappers';
import { heroApi } from '../api/heroApi';
import { CompleteQuestResult, questApi } from '../api/questApi';
import { getSkillById } from '../config/skills';
import { env } from '../config/env';
import { generateQuestNarrative } from '../engine/journalEngine';
import { getQuestSkillBonus } from '../engine/skillEngine';
import { getStreakMultiplier } from '../engine/streakEngine';
import { calculateXPReward } from '../engine/xpEngine';
import { getWeeklyPathQuestBonus } from '../config/weeklyPaths';
import { emptyStatBlock } from '../utils/stats';
import { useAuthStore } from './authStore';
import { useForgedSkillStore } from './forgedSkillStore';
import { useHeroStore } from './heroStore';
import { useJournalStore } from './journalStore';
import { useQuestStore } from './questStore';
import { useRaidStore } from './raidStore';
import { useSettingsStore } from './settingsStore';
import { useSkillStore } from './skillStore';
import { Quest, Skill, StatLevelUpResult, StatName } from '../types';

interface QuestCompletionFlowResult {
  quest: Quest;
  completed: boolean;
  xpAwarded: number;
  levelResult: StatLevelUpResult | null;
  newSkills: Skill[];
  appearanceUnlock: { shapes: string[]; sigils: string[] } | null;
  stepAdvancedOnly: boolean;
}

interface GameplayState {
  initializingSession: boolean;
  initializeSession: () => Promise<void>;
  completeQuest: (questId: string) => Promise<QuestCompletionFlowResult | null>;
  runDailyLifecycle: () => { rewardAvailable: boolean; usedStreakFreeze: boolean };
  resetLocalState: () => void;
}

function applyJournalEntry(
  quest: Quest,
  xpAwarded: number,
  levelResult: QuestCompletionFlowResult['levelResult'],
  newSkills: Skill[],
): void {
  useJournalStore.getState().updateTodayEntry({
    narrative: generateQuestNarrative(quest),
    questsCompleted: [quest.id],
    xpGained: {
      ...emptyStatBlock(),
      [quest.stat]: xpAwarded,
    },
    levelsGained: levelResult ? [levelResult.stat] : [],
    skillsUnlocked: newSkills.map((skill) => skill.id),
  });
}

function getSkillsById(skillIds: string[]): Skill[] {
  return skillIds.map((skillId) => getSkillById(skillId)).filter((skill): skill is Skill => !!skill);
}

function mapLevelResult(
  stat: StatName,
  oldLevel: number,
  newLevel: number,
  tierUp: { newTier: number; newClass: string } | null,
  newSkills: Skill[],
): StatLevelUpResult | null {
  if (newLevel <= oldLevel) {
    return null;
  }

  return {
    stat,
    oldLevel,
    newLevel,
    newSkills,
    tierUp: tierUp ? { newTier: tierUp.newTier as 1 | 2 | 3 | 4 | 5, newClass: tierUp.newClass } : undefined,
  };
}

function markQuestCompletedLocally(quest: Quest): Quest {
  const now = new Date().toISOString();
  return {
    ...quest,
    isCompleted: true,
    completedAt: now,
    updatedAt: now,
    daysCompleted: quest.daysCompleted + 1,
    streak: quest.streak + 1,
    bestStreak: Math.max(quest.bestStreak, quest.streak + 1),
  };
}

function applyAuthoritativeCompletion(
  quest: Quest,
  completion: CompleteQuestResult,
  priorSkillIds: Set<string>,
): QuestCompletionFlowResult {
  applyApiHeroSnapshot(completion.hero);

  const newSkillIds = completion.hero.unlockedSkills
    .map((skill) => skill.skillId)
    .filter((skillId) => !priorSkillIds.has(skillId));
  const newSkills =
    completion.newSkills.length > 0
      ? getSkillsById(completion.newSkills.map((s) => s.id))
      : getSkillsById(newSkillIds);

  useQuestStore.getState().upsertQuest(quest);
  const appearanceUnlock = useHeroStore.getState().checkAppearanceUnlocks();
  const levelResult = mapLevelResult(
    completion.stat,
    completion.oldLevel,
    completion.newLevel,
    completion.tierUp,
    newSkills,
  );
  applyJournalEntry(quest, completion.xpAwarded, levelResult, newSkills);

  return {
    quest,
    completed: true,
    xpAwarded: completion.xpAwarded,
    levelResult,
    newSkills,
    appearanceUnlock,
    stepAdvancedOnly: false,
  };
}

async function completeAuthoritativeQuest(quest: Quest): Promise<QuestCompletionFlowResult | null> {
  const priorSkillIds = new Set(useSkillStore.getState().getUnlockedSkillIds());

  if (quest.type === 'boss') {
    const stepResult = await questApi.advanceBossStep(quest.id);
    const latestQuest = mapApiQuest(stepResult.quest);
    useQuestStore.getState().upsertQuest(latestQuest);

    if (!stepResult.completion) {
      return {
        quest: latestQuest,
        completed: false,
        xpAwarded: 0,
        levelResult: null,
        newSkills: [],
        appearanceUnlock: null,
        stepAdvancedOnly: true,
      };
    }

    return applyAuthoritativeCompletion(latestQuest, stepResult.completion, priorSkillIds);
  }

  const result = await questApi.complete(quest.id);
  const completedQuest = markQuestCompletedLocally(quest);
  return applyAuthoritativeCompletion(completedQuest, result, priorSkillIds);
}

function completeLocalQuest(questId: string): QuestCompletionFlowResult | null {
  const skillState = useSkillStore.getState();
  const heroState = useHeroStore.getState();
  const questState = useQuestStore.getState();
  const hero = heroState.hero;

  if (!hero) {
    console.error('[GameplayStore] Cannot complete a local quest without an active hero.', {
      questId,
    });
    return null;
  }

  questState.resetDailyQuests();

  const quest = questState.getQuestById(questId);
  if (!quest) {
    console.warn('[GameplayStore] Tried to complete a missing local quest.', {
      questId,
    });
    return null;
  }

  const unlockedSkillIds = skillState.getUnlockedSkillIds();
  const settings = useSettingsStore.getState();
  const updatedQuest =
    quest.type === 'boss' ? questState.completeBossStep(quest.id) : questState.completeQuest(quest.id);
  if (!updatedQuest) {
    console.warn('[GameplayStore] Quest completion was ignored because the quest is inactive or already done.', {
      questId,
      questType: quest.type,
    });
    return null;
  }

  if (!updatedQuest.isCompleted) {
    return {
      quest: updatedQuest,
      completed: false,
      xpAwarded: 0,
      levelResult: null,
      newSkills: [],
      appearanceUnlock: null,
      stepAdvancedOnly: true,
    };
  }

  const streakUpdate = heroState.updateStreak(unlockedSkillIds);
  if (streakUpdate?.usedStreakFreeze) {
    console.info('[GameplayStore] Preserved the current streak with a freeze during quest completion.', {
      questId,
    });
  }

  const streakMult = getStreakMultiplier(useHeroStore.getState().hero?.currentStreak ?? hero.currentStreak);
  const skillBonus = getQuestSkillBonus(
    { stat: updatedQuest.stat, type: updatedQuest.type },
    unlockedSkillIds,
  );
  const weeklyPathBonus = getWeeklyPathQuestBonus(settings, {
    stat: updatedQuest.stat,
    type: updatedQuest.type,
  });
  const xpReward = calculateXPReward(updatedQuest.difficulty, streakMult, skillBonus + weeklyPathBonus);
  const progression = heroState.applyQuestReward(updatedQuest.stat, xpReward.totalXP, unlockedSkillIds);
  if (!progression) {
    console.error('[GameplayStore] Failed to apply the local quest reward.', {
      questId,
      questType: updatedQuest.type,
      stat: updatedQuest.stat,
      xpAwarded: xpReward.totalXP,
    });
    return null;
  }

  const newSkills = skillState.checkAndUnlockSkills(progression.hero.statXP);
  const appearanceUnlock = heroState.checkAppearanceUnlocks();
  applyJournalEntry(updatedQuest, xpReward.totalXP, progression.levelResult, newSkills);

  return {
    quest: updatedQuest,
    completed: true,
    xpAwarded: xpReward.totalXP,
    levelResult: progression.levelResult,
    newSkills,
    appearanceUnlock,
    stepAdvancedOnly: false,
  };
}

export const useGameplayStore = create<GameplayState>((set) => ({
  initializingSession: false,

  initializeSession: async () => {
    if (env.demoMode) return;

    const authStatus = useAuthStore.getState().status;
    if (authStatus !== 'authenticated') return;

    set({ initializingSession: true });
    try {
      useSettingsStore.getState().clearStaleWeeklyPath();
      const [apiHero, apiQuests] = await Promise.all([heroApi.getMine(), questApi.list()]);
      applyApiHeroSnapshot(apiHero, apiQuests);
      await useForgedSkillStore.getState().load();
      await useRaidStore.getState().load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        useHeroStore.getState().clearHero();
        useQuestStore.getState().clearQuests();
        useSkillStore.getState().clearUnlockedSkills();
        useJournalStore.getState().clearEntries();
        useForgedSkillStore.getState().clear();
        useRaidStore.getState().clear();
        return;
      }
      throw error;
    } finally {
      set({ initializingSession: false });
    }
  },

  completeQuest: async (questId) => {
    const authoritative = !env.demoMode && useAuthStore.getState().status === 'authenticated';
    try {
      if (authoritative) {
        const quest = useQuestStore.getState().getQuestById(questId);
        if (!quest) {
          console.warn('[GameplayStore] Tried to complete a missing authoritative quest.', {
            questId,
          });
          return null;
        }

        return await completeAuthoritativeQuest(quest);
      }

      return completeLocalQuest(questId);
    } catch (error) {
      console.error('[GameplayStore] Quest completion failed.', {
        questId,
        authoritative,
        error,
      });
      throw error;
    }
  },

  runDailyLifecycle: () => {
    const unlockedSkillIds = useSkillStore.getState().getUnlockedSkillIds();
    useSettingsStore.getState().clearStaleWeeklyPath();
    useQuestStore.getState().resetDailyQuests();
    const result = useHeroStore.getState().updateStreak(unlockedSkillIds);
    if (result?.usedStreakFreeze) {
      console.info('[GameplayStore] Daily lifecycle used a streak freeze to preserve progress.');
    }

    return {
      rewardAvailable: useHeroStore.getState().getDailyRewardPreview() !== null,
      usedStreakFreeze: result?.usedStreakFreeze ?? false,
    };
  },

  resetLocalState: () => {
    useHeroStore.getState().clearHero();
    useQuestStore.getState().clearQuests();
    useSkillStore.getState().clearUnlockedSkills();
    useJournalStore.getState().clearEntries();
    useForgedSkillStore.getState().clear();
    useRaidStore.getState().clear();
  },
}));
