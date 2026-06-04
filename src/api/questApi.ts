// Quest API stubs — unused until Supabase is configured

import { Quest } from '../types';

export async function fetchQuests(_heroId: string): Promise<Quest[]> {
  // TODO: supabase.from('quests').select().eq('hero_id', heroId)
  return [];
}

export async function saveQuest(_quest: Quest): Promise<void> {
  // TODO: supabase.from('quests').upsert(quest)
}

export async function deleteQuest(_questId: string): Promise<void> {
  // TODO: supabase.from('quests').delete().eq('id', questId)
}

export async function recordCompletion(_questId: string, _xpGained: number): Promise<void> {
  // TODO: supabase.from('quest_completions').insert(...)
}
