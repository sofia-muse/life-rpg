import { StatName } from '../types';

// Wire shapes returned by the .NET API (camelCase). Stat blocks come back as objects keyed by stat.
export interface ApiStatBlock {
  strength: number;
  vitality: number;
  intelligence: number;
  charisma: number;
  dexterity: number;
  willpower: number;
}

export interface ApiHero {
  id: string;
  name: string;
  avatarSeed: string;
  heroLevel: number;
  className: string;
  classTier: number;
  dominantStat: StatName;
  totalQuestsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  lastRewardDate: string | null;
  totalLoginDays: number;
  statXp: ApiStatBlock;
  stats: ApiStatBlock;
}

export interface ApiQuest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'side' | 'boss';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  stat: StatName;
  xpReward: number;
  isCompleted: boolean;
  isActive: boolean;
  completedAt: string | null;
  streak: number;
  bestStreak: number;
  daysCompleted: number;
  totalSteps: number | null;
  completedSteps: number | null;
}
