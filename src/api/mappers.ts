import { ApiHero, ApiQuest } from './dto';
import { Hero, Quest } from '../types';

export function mapApiHero(hero: ApiHero): Hero {
  return {
    id: hero.id,
    name: hero.name,
    avatarSeed: hero.avatarSeed,
    createdAt: hero.createdAt,
    updatedAt: hero.updatedAt,
    stats: hero.stats,
    statXP: hero.statXp,
    heroLevel: hero.heroLevel,
    className: hero.className,
    classTier: hero.classTier as Hero['classTier'],
    dominantStat: hero.dominantStat,
    totalQuestsCompleted: hero.totalQuestsCompleted,
    currentStreak: hero.currentStreak,
    longestStreak: hero.longestStreak,
    lastActiveDate: hero.lastActiveDate ?? '',
    restDaysUsed: hero.restDaysUsed,
    appearance: hero.appearance,
    characterAppearance: hero.characterAppearance,
    lastRewardDate: hero.lastRewardDate ?? '',
    totalLoginDays: hero.totalLoginDays,
    lastStreakFreezeDate: hero.lastStreakFreezeDate ?? undefined,
  };
}

export function mapApiQuest(quest: ApiQuest): Quest {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    type: quest.type,
    difficulty: quest.difficulty,
    stat: quest.stat,
    xpReward: quest.xpReward,
    isCompleted: quest.isCompleted,
    isActive: quest.isActive,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
    completedAt: quest.completedAt ?? undefined,
    streak: quest.streak,
    bestStreak: quest.bestStreak,
    daysCompleted: quest.daysCompleted,
    totalSteps: quest.totalSteps ?? undefined,
    completedSteps: quest.completedSteps ?? undefined,
  };
}
