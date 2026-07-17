// Party raid API — cooperative bosses (online-only, requires auth).
import { apiFetch } from './client';
import { StatName } from '../types';

export type RaidMemberRole = 'leader' | 'member';

export interface RaidMemberDto {
  heroId: string;
  heroName: string;
  className: string;
  role: RaidMemberRole;
  personalTotal: number;
  joinedAt: string;
}

export interface RaidContributionDto {
  id: string;
  heroId: string;
  heroName: string;
  amount: number;
  note: string | null;
  contributionDate: string;
  createdAt: string;
}

export interface RaidDto {
  id: string;
  title: string;
  description: string;
  sagaTitle: string;
  rewardTitle: string;
  unitLabel: string;
  targetAmount: number;
  currentAmount: number;
  stat: StatName;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  deadline: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  leaderHeroId: string;
  leaderHeroName: string;
  yourContribution: number;
  members: RaidMemberDto[];
  recentContributions: RaidContributionDto[];
}

export interface CreateRaidRequest {
  title: string;
  description: string;
  sagaTitle?: string | null;
  rewardTitle?: string | null;
  unitLabel: string;
  targetAmount: number;
  stat: StatName;
  maxMembers?: number | null;
  deadline?: string | null;
}

export interface ContributeRaidResult {
  raid: RaidDto;
  justCompleted: boolean;
}

export const raidApi = {
  listMine: () => apiFetch<RaidDto[]>('/api/v1/raids'),

  get: (id: string) => apiFetch<RaidDto>(`/api/v1/raids/${id}`),

  create: (body: CreateRaidRequest) =>
    apiFetch<RaidDto>('/api/v1/raids', { method: 'POST', body }),

  join: (inviteCode: string) =>
    apiFetch<RaidDto>('/api/v1/raids/join', { method: 'POST', body: { inviteCode } }),

  contribute: (raidId: string, amount: number, clientId: string, note?: string) =>
    apiFetch<ContributeRaidResult>(`/api/v1/raids/${raidId}/contribute`, {
      method: 'POST',
      body: { amount, clientId, note: note ?? null },
    }),
};
