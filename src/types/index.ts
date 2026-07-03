// ─── Life RPG — Core Types ───

export type StatName =
  | 'strength'
  | 'vitality'
  | 'intelligence'
  | 'charisma'
  | 'dexterity'
  | 'willpower';

export type SkillCategory = StatName | 'cross';

export type QuestType = 'daily' | 'side' | 'boss';

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type SkillEffect =
  | {
      type: 'displayText';
      text: string;
    }
  | {
      type: 'questXpBonus';
      percent: number;
      stats?: StatName[];
      questTypes?: QuestType[];
      appliesToAllQuests?: boolean;
    }
  | {
      type: 'restDayXp';
      stat: StatName;
      amount: number;
    }
  | {
      type: 'streakRetention';
      retentionPercent: number;
    }
  | {
      type: 'streakFreeze';
      missesPerWeek: number;
    }
  | {
      type: 'activeDailyQuestCapacity';
      additionalSlots: number;
    };

export type ClassTier = 1 | 2 | 3 | 4 | 5;

// ─── Hero Appearance ───
export type CrestShape = 'shield' | 'circle' | 'diamond' | 'hexagon';
export type SigilStyle = 'sword' | 'flame' | 'eye' | 'star' | 'tree' | 'crown';
export type AccentOverride = StatName | 'gold' | 'silver' | 'none';

// ─── Character Appearance ───
export type Gender = 'male' | 'female';
export type SkinTone = 0 | 1 | 2 | 3 | 4 | 5;
export type HairStyle = 'short' | 'medium' | 'long' | 'shaved';
export type HairColor = 0 | 1 | 2 | 3 | 4;
export type EyeStyle = 'circle' | 'oval' | 'smile';
export type MouthStyle = 'laugh' | 'smile' | 'peace';
export type GlassesStyle = 'none' | 'round' | 'square';

export interface CharacterAppearance {
  gender: Gender;
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
  glassesStyle: GlassesStyle;
}

export interface HeroAppearance {
  crestShape: CrestShape;
  sigil: SigilStyle;
  accentOverride: AccentOverride;
  titleDisplay: boolean;
  unlockedCrestShapes: CrestShape[];
  unlockedSigils: SigilStyle[];
}

export interface StatBlock {
  strength: number;
  vitality: number;
  intelligence: number;
  charisma: number;
  dexterity: number;
  willpower: number;
}

export interface StatProgress {
  stat: StatName;
  currentXP: number;
  level: number;
  xpToNextLevel: number;
}

export interface Hero {
  id: string;
  name: string;
  avatarSeed: string;
  createdAt: string;
  updatedAt?: string;
  stats: StatBlock;
  statXP: Record<StatName, number>;
  heroLevel: number;
  className: string;
  classTier: ClassTier;
  dominantStat: StatName;
  totalQuestsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  restDaysUsed: number;
  appearance: HeroAppearance;
  characterAppearance: CharacterAppearance;
  lastRewardDate: string;
  totalLoginDays: number;
  lastStreakFreezeDate?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  stat: StatName;
  xpReward: number;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  streak: number;
  bestStreak: number;
  daysCompleted: number;
  // Boss quest fields
  totalSteps?: number;
  completedSteps?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  requiredStat?: StatName;
  requiredLevel: number;
  secondaryStat?: StatName;
  secondaryLevel?: number;
  icon: string;
  effect: string;
  effects: SkillEffect[];
}

export interface UnlockedSkill {
  skillId: string;
  unlockedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  narrative: string;
  questsCompleted: string[];
  xpGained: Record<StatName, number>;
  levelsGained: StatName[];
  skillsUnlocked: string[];
  milestones: string[];
}

export interface ClassDefinition {
  tier: ClassTier;
  name: string;
  dominantStat: StatName;
  requiredLevel: number;
  title: string;
  description: string;
  specialization?: string;
}

export interface XPThreshold {
  level: number;
  totalXP: number;
  xpForLevel: number;
}

export interface StreakMilestone {
  days: number;
  multiplier: number;
  title: string;
}

export interface NotificationTemplate {
  type: 'quest_reminder' | 'streak_warning' | 'level_up' | 'daily_motivation';
  title: string;
  body: string;
}

export interface AvatarConfig {
  tier: ClassTier;
  dominantStat: StatName;
  palette: string[];
  aura: string;
  badge: string;
}

// Store types
export interface HeroStore {
  hero: Hero | null;
  isOnboarded: boolean;
  createHero: (name: string, avatarSeed: string, focusStats: StatName[]) => void;
  addXP: (stat: StatName, amount: number) => StatLevelUpResult | null;
  recordQuestCompletion: () => void;
  updateStreak: (unlockedSkillIds: string[]) => { usedStreakFreeze: boolean; rewardAvailable: boolean } | null;
  takeRestDay: (unlockedSkillIds: string[]) => void;
  getStatProgress: (stat: StatName) => StatProgress;
}

export interface QuestStore {
  quests: Quest[];
  addQuest: (
    quest: Omit<
      Quest,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'isCompleted'
      | 'completedAt'
      | 'streak'
      | 'bestStreak'
      | 'daysCompleted'
    >,
  ) => void;
  completeQuest: (questId: string) => Quest | null;
  deleteQuest: (questId: string) => void;
  toggleQuestActive: (questId: string) => void;
  getDailyQuests: () => Quest[];
  getSideQuests: () => Quest[];
  getBossQuests: () => Quest[];
  getActiveQuests: () => Quest[];
  completeBossStep: (questId: string) => Quest | null;
}

export interface SkillStore {
  unlockedSkills: UnlockedSkill[];
  checkAndUnlockSkills: (statXP: Record<StatName, number>) => Skill[];
  isSkillUnlocked: (skillId: string) => boolean;
}

export interface JournalStore {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  getTodayEntry: () => JournalEntry | undefined;
  getEntriesByDate: (date: string) => JournalEntry[];
}

export interface UIStore {
  showLevelUpModal: boolean;
  levelUpData: { stat: StatName; newLevel: number } | null;
  showSkillUnlockModal: boolean;
  skillUnlockData: Skill | null;
  showTierUpModal: boolean;
  tierUpData: { newTier: ClassTier; newClass: string } | null;
  showXPPopup: boolean;
  xpPopupData: { stat: StatName; amount: number } | null;
  showQuestCreateModal: boolean;
  setLevelUp: (stat: StatName, newLevel: number) => void;
  setSkillUnlock: (skill: Skill) => void;
  setTierUp: (newTier: ClassTier, newClass: string) => void;
  showXP: (stat: StatName, amount: number) => void;
  dismissLevelUp: () => void;
  dismissSkillUnlock: () => void;
  dismissTierUp: () => void;
  dismissXP: () => void;
  setQuestCreateModal: (show: boolean) => void;
}

export interface SettingsStore {
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string;
  aiSkillsEnabled: boolean;
  toggleNotifications: () => void;
  toggleHaptic: () => void;
  setReminderTime: (time: string) => void;
  toggleAiSkills: () => void;
}

export interface StatLevelUpResult {
  stat: StatName;
  oldLevel: number;
  newLevel: number;
  newSkills: Skill[];
  tierUp?: { newTier: ClassTier; newClass: string };
}

// Difficulty XP mapping
export const DIFFICULTY_XP: Record<QuestDifficulty, number> = {
  easy: 15,
  medium: 25,
  hard: 50,
  legendary: 100,
};

export const STAT_NAMES: StatName[] = [
  'strength',
  'vitality',
  'intelligence',
  'charisma',
  'dexterity',
  'willpower',
];

export const STAT_COLORS: Record<StatName, string> = {
  strength: '#EF4444',
  vitality: '#22C55E',
  intelligence: '#3B82F6',
  charisma: '#F59E0B',
  dexterity: '#8B5CF6',
  willpower: '#EC4899',
};

export const STAT_ICONS: Record<StatName, string> = {
  strength: '⚔️',
  vitality: '❤️',
  intelligence: '📚',
  charisma: '✨',
  dexterity: '🏃',
  willpower: '🔥',
};
