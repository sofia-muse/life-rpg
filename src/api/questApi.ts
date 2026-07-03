// Quest API — online calls to the .NET backend.
import { apiFetch } from './client';
import { ApiQuest, ApiHero } from './dto';
import { QuestType, QuestDifficulty, StatName } from '../types';

export interface CompleteQuestResult {
  stat: StatName;
  xpAwarded: number;
  baseXp: number;
  streakBonus: number;
  skillBonus: number;
  oldLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  tierUp: { newTier: number; newClass: string } | null;
  newSkills: { id: string; name: string; icon: string; effect: string }[];
  hero: ApiHero;
}

export interface AdvanceBossQuestResult {
  quest: ApiQuest;
  completion: CompleteQuestResult | null;
}

export const questApi = {
  list: (type?: QuestType, active?: boolean) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (active !== undefined) params.set('active', String(active));
    const qs = params.toString();
    return apiFetch<ApiQuest[]>(`/api/v1/quests${qs ? `?${qs}` : ''}`);
  },

  create: (input: {
    title: string;
    description: string;
    type: QuestType;
    difficulty: QuestDifficulty;
    stat: StatName;
    totalSteps?: number | null;
  }) => apiFetch<ApiQuest>('/api/v1/quests', { method: 'POST', body: input }),

  remove: (id: string) => apiFetch<void>(`/api/v1/quests/${id}`, { method: 'DELETE' }),

  /** Server-authoritative completion — returns the recomputed progression + modal payload. */
  complete: (id: string) =>
    apiFetch<CompleteQuestResult>(`/api/v1/quests/${id}/complete`, { method: 'POST' }),

  advanceBossStep: (id: string) =>
    apiFetch<AdvanceBossQuestResult>(`/api/v1/quests/${id}/boss-step`, { method: 'POST' }),
};
