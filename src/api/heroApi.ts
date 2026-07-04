// Hero API — online calls to the .NET backend. Used when demo mode is off and the user is authed.
import { apiFetch } from './client';
import { ApiHero } from './dto';
import { CharacterAppearance, StatName } from '../types';

export interface WeeklyCupDto {
  pathLabel: string;
  contractTitle: string;
  score: number;
  rank: string;
  completedMatches: number;
  requiredCount: number;
  bossProgress: number;
  streakBoost: number;
  rewardTitle: string;
  rewardBadge: string;
}

export const heroApi = {
  getMine: () => apiFetch<ApiHero>('/api/v1/heroes/me'),

  create: (
    name: string,
    avatarSeed: string,
    focusStats: StatName[],
    characterAppearance?: CharacterAppearance,
  ) =>
    apiFetch<ApiHero>('/api/v1/heroes', {
      method: 'POST',
      body: { name, avatarSeed, focusStats, characterAppearance },
    }),

  updateAppearance: (appearance: unknown, characterAppearance: unknown) =>
    apiFetch<ApiHero>('/api/v1/heroes/me/appearance', {
      method: 'PUT',
      body: { appearance, characterAppearance },
    }),

  getWeeklyCup: () => apiFetch<WeeklyCupDto>('/api/v1/heroes/me/weekly-cup'),

  deleteMine: () => apiFetch<void>('/api/v1/heroes/me', { method: 'DELETE' }),
};
