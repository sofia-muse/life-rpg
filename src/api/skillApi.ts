// Skill API — AI-forged skills (online-only).
import { apiFetch } from './client';

/** Wire shape returned by the backend (SkillDto). */
export interface ForgedSkillDto {
  id: string;
  name: string;
  description: string;
  category: string; // a stat name, lowercased
  icon: string;
  effect: string; // e.g. "+7% XP on Strength quests"
}

export const skillApi = {
  /** Forge a new AI-generated skill for the current hero. */
  forge: () => apiFetch<ForgedSkillDto>('/api/v1/skills/forge', { method: 'POST' }),

  /** List the current hero's forged skills. */
  listForged: () => apiFetch<ForgedSkillDto[]>('/api/v1/skills/forged'),
};
