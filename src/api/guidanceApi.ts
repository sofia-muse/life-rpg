import { apiFetch } from './client';
import { QuestDifficulty, QuestType, StatName } from '../types';

export interface SuggestedQuestDto {
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  stat: StatName;
  whyItFits: string;
  totalSteps: number | null;
}

export interface QuestSuggestionPackDto {
  contractTitle: string;
  suggestions: SuggestedQuestDto[];
}

export interface BossQuestPlanDto {
  sagaTitle: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  stat: StatName;
  totalSteps: number;
  steps: string[];
  rewardTitle: string;
}

export interface ChronicleDto {
  title: string;
  narrative: string;
  highlights: string[];
}

export interface RaidSagaPlanDto {
  sagaTitle: string;
  title: string;
  description: string;
  unitLabel: string;
  targetAmount: number;
  stat: StatName;
  rewardTitle: string;
}

export interface WeeklyPathSuggestionDto {
  path: string;
  label: string;
  focus: string;
  vow: string;
  whyItFits: string;
  rewardTitle: string;
  rewardBadge: string;
}

export const guidanceApi = {
  getQuestSuggestions: () => apiFetch<QuestSuggestionPackDto>('/api/v1/guidance/quests'),
  planBossQuest: (goal: string, suggestedStat?: StatName) =>
    apiFetch<BossQuestPlanDto>('/api/v1/guidance/boss-plan', {
      method: 'POST',
      body: { goal, suggestedStat: suggestedStat ?? null },
    }),
  getChronicle: () => apiFetch<ChronicleDto>('/api/v1/guidance/chronicle'),
  planRaidSaga: (goal: string, unitLabel?: string, targetAmount?: number, suggestedStat?: StatName) =>
    apiFetch<RaidSagaPlanDto>('/api/v1/guidance/raid-saga', {
      method: 'POST',
      body: {
        goal,
        title: goal,
        unitLabel: unitLabel ?? null,
        targetAmount: targetAmount ?? null,
        stat: suggestedStat ?? null,
      },
    }),
  suggestWeeklyPath: () => apiFetch<WeeklyPathSuggestionDto>('/api/v1/guidance/weekly-path'),
};
