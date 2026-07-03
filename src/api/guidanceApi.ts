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

export const guidanceApi = {
  getQuestSuggestions: () => apiFetch<QuestSuggestionPackDto>('/api/v1/guidance/quests'),
  planBossQuest: (goal: string, suggestedStat?: StatName) =>
    apiFetch<BossQuestPlanDto>('/api/v1/guidance/boss-plan', {
      method: 'POST',
      body: { goal, suggestedStat: suggestedStat ?? null },
    }),
  getChronicle: () => apiFetch<ChronicleDto>('/api/v1/guidance/chronicle'),
};
