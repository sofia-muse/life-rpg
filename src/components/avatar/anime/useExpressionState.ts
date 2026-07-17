import { useMemo } from 'react';
import { Hero } from '../../../types';

export type Mood = 'happy' | 'neutral' | 'sad';
export type CharacterEvent =
  | 'idle'
  | 'questComplete'
  | 'levelUp'
  | 'tierUp'
  | 'rest'
  | 'bossPhase'
  | 'evolution'
  | 'contractComplete';

export function useExpressionState(hero: Hero | null): {
  mood: Mood;
} {
  return useMemo(() => {
    if (!hero) return { mood: 'neutral' as Mood };

    const today = new Date().toISOString().split('T')[0];
    const streakBroken = hero.lastActiveDate !== today && hero.currentStreak === 0;

    if (hero.currentStreak >= 3) return { mood: 'happy' as Mood };
    if (streakBroken) return { mood: 'sad' as Mood };
    return { mood: 'neutral' as Mood };
  }, [hero?.currentStreak, hero?.lastActiveDate]);
}
