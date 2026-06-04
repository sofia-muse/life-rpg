// Hero API stubs — unused until Supabase is configured
// These will sync local Zustand state with Supabase when enabled

import { Hero } from '../types';

export async function fetchHero(_userId: string): Promise<Hero | null> {
  // TODO: return supabase.from('heroes').select().eq('user_id', userId).single()
  return null;
}

export async function saveHero(_hero: Hero): Promise<void> {
  // TODO: supabase.from('heroes').upsert(hero)
}

export async function deleteHero(_heroId: string): Promise<void> {
  // TODO: supabase.from('heroes').delete().eq('id', heroId)
}
