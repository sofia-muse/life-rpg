import { CharacterAppearance, HeroAppearance, StatName, UnlockedSkill, WeeklyPath } from '../types';

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
  createdAt: string;
  updatedAt: string;
  heroLevel: number;
  className: string;
  classTier: number;
  dominantStat: StatName;
  totalQuestsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  lastStreakFreezeDate: string | null;
  lastRewardDate: string | null;
  restDaysUsed: number;
  totalLoginDays: number;
  statXp: ApiStatBlock;
  stats: ApiStatBlock;
  appearance: HeroAppearance;
  characterAppearance: CharacterAppearance;
  unlockedSkills: UnlockedSkill[];
  settings: {
    notificationsEnabled: boolean;
    hapticEnabled: boolean;
    reminderTime: string;
    aiSkillsEnabled: boolean;
    weeklyPath: WeeklyPath | null;
    weeklyPathWeekKey: string | null;
    weeklyPathStartedAt: string | null;
    weeklyRewardWeekKey: string | null;
    weeklyRewardTitle: string | null;
    weeklyRewardBadge: string | null;
  };
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
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  streak: number;
  bestStreak: number;
  daysCompleted: number;
  totalSteps: number | null;
  completedSteps: number | null;
}
