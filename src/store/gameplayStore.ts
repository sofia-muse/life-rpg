import { create } from 'zustand';
import { ApiError } from '../api/client';
import { mapApiHero, mapApiQuest } from '../api/mappers';
import { heroApi } from '../api/heroApi';
import { questApi } from '../api/questApi';
import { getSkillById } from '../config/skills';
import { env } from '../config/env';
import { generateQuestNarrative } from '../engine/journalEngine';
import { getQuestSkillBonus } from '../engine/skillEngine';
import { getStreakMultiplier } from '../engine/streakEngine';
import { calculateXPReward } from '../engine/xpEngine';
import { useAuthStore } from './authStore';
import { useForgedSkillStore } from './forgedSkillStore';
import { useHeroStore } from './heroStore';
import { useJournalStore } from './journalStore';
import { useQuestStore } from './questStore';
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

const emptyXpGained = (): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
});

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
      ...emptyXpGained(),
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

async function completeAuthoritativeQuest(quest: Quest): Promise<QuestCompletionFlowResult | null> {
  const priorSkillIds = new Set(useSkillStore.getState().getUnlockedSkillIds());
  let completion:
    | {
        stat: StatName;
        xpAwarded: number;
        oldLevel: number;
        newLevel: number;
        tierUp: { newTier: number; newClass: string } | null;
      }
    | null = null;

  if (quest.type === 'boss') {
    const stepResult = await questApi.advanceBossStep(quest.id);
    const latestQuest = mapApiQuest(stepResult.quest);

    if (!stepResult.completion) {
      useQuestStore.getState().upsertQuest(latestQuest);
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

    completion = {
      stat: stepResult.completion.stat,
      xpAwarded: stepResult.completion.xpAwarded,
      oldLevel: stepResult.completion.oldLevel,
      newLevel: stepResult.completion.newLevel,
      tierUp: stepResult.completion.tierUp,
    };
  } else {
    const result = await questApi.complete(quest.id);
    completion = {
      stat: result.stat,
      xpAwarded: result.xpAwarded,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      tierUp: result.tierUp,
    };
  }

  const [apiHero, apiQuests] = await Promise.all([heroApi.getMine(), questApi.list()]);
  const mappedHero = mapApiHero(apiHero);
  const newSkillIds = apiHero.unlockedSkills
    .map((skill) => skill.skillId)
    .filter((skillId) => !priorSkillIds.has(skillId));
  const newSkills = getSkillsById(newSkillIds);

  useHeroStore.getState().setHero(mappedHero, { isOnboarded: true });
  useSkillStore.getState().replaceUnlockedSkills(apiHero.unlockedSkills);
  useSettingsStore.getState().replaceSettings(apiHero.settings);
  useQuestStore.getState().replaceQuests(apiQuests.map(mapApiQuest));

  const refreshedQuest = useQuestStore.getState().getQuestById(quest.id) ?? quest;
  const appearanceUnlock = useHeroStore.getState().checkAppearanceUnlocks();
  const levelResult = completion
    ? mapLevelResult(completion.stat, completion.oldLevel, completion.newLevel, completion.tierUp, newSkills)
    : null;
  const xpAwarded = completion?.xpAwarded ?? 0;
  applyJournalEntry(refreshedQuest, xpAwarded, levelResult, newSkills);

  return {
    quest: refreshedQuest,
    completed: true,
    xpAwarded,
    levelResult,
    newSkills,
    appearanceUnlock,
    stepAdvancedOnly: false,
  };
}

function completeLocalQuest(quest: Quest): QuestCompletionFlowResult | null {
  const skillState = useSkillStore.getState();
  const heroState = useHeroStore.getState();
  const questState = useQuestStore.getState();

  const unlockedSkillIds = skillState.getUnlockedSkillIds();
  const updatedQuest =
    quest.type === 'boss' ? questState.completeBossStep(quest.id) : questState.completeQuest(quest.id);
  if (!updatedQuest) return null;

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

  const streakMult = getStreakMultiplier(useHeroStore.getState().hero?.currentStreak ?? 0);
  const skillBonus = getQuestSkillBonus(
    { stat: updatedQuest.stat, type: updatedQuest.type },
    unlockedSkillIds,
  );
  const xpReward = calculateXPReward(updatedQuest.difficulty, streakMult, skillBonus);
  const progression = heroState.applyQuestReward(updatedQuest.stat, xpReward.totalXP, unlockedSkillIds);
  if (!progression) return null;

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
      const [apiHero, apiQuests] = await Promise.all([heroApi.getMine(), questApi.list()]);
      useHeroStore.getState().setHero(mapApiHero(apiHero), { isOnboarded: true });
      useSkillStore.getState().replaceUnlockedSkills(apiHero.unlockedSkills);
      useSettingsStore.getState().replaceSettings(apiHero.settings);
      useQuestStore.getState().replaceQuests(apiQuests.map(mapApiQuest));
      await useForgedSkillStore.getState().load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        useHeroStore.getState().clearHero();
        useQuestStore.getState().clearQuests();
        useSkillStore.getState().clearUnlockedSkills();
        useJournalStore.getState().clearEntries();
        useForgedSkillStore.getState().clear();
        return;
      }
      throw error;
    } finally {
      set({ initializingSession: false });
    }
  },

  completeQuest: async (questId) => {
    const quest = useQuestStore.getState().getQuestById(questId);
    if (!quest) return null;

    const authoritative = !env.demoMode && useAuthStore.getState().status === 'authenticated';
    return authoritative ? completeAuthoritativeQuest(quest) : completeLocalQuest(quest);
  },

  runDailyLifecycle: () => {
    const unlockedSkillIds = useSkillStore.getState().getUnlockedSkillIds();
    useQuestStore.getState().resetDailyQuests();
    const result = useHeroStore.getState().updateStreak(unlockedSkillIds);

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
  },
}));
