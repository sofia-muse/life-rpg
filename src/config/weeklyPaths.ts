import { ClassFlair, Quest, QuestType, StatName, WeeklyPath } from '../types';

export interface WeeklyPathSettingsLike {
  weeklyPath: WeeklyPath | null;
  weeklyPathWeekKey: string | null;
  weeklyPathStartedAt: string | null;
  weeklyRewardWeekKey: string | null;
  weeklyRewardTitle: string | null;
  weeklyRewardBadge: string | null;
}

export interface WeeklyPathDefinition {
  id: WeeklyPath;
  label: string;
  stats: [StatName, StatName];
  focus: string;
  vow: string;
  summary: string;
  rewardTitle: string;
  rewardBadge: string;
  flair: ClassFlair;
  bonusPercent: number;
  requiredCount: number;
  allowedQuestTypes: QuestType[];
}

export interface WeeklyCupSummary {
  label: string;
  score: number;
  rank: 'bronze' | 'silver' | 'gold' | 'mythic';
  contractProgress: number;
  bossProgress: number;
  streakBoost: number;
}

export const WEEKLY_PATHS: Record<WeeklyPath, WeeklyPathDefinition> = {
  power: {
    id: 'power',
    label: 'Power',
    stats: ['strength', 'vitality'],
    focus: 'physical power, recovery, and resilience',
    vow: 'Train boldly. Recover deliberately. Let your body prove your resolve.',
    summary: 'Power weeks reward physical effort, training consistency, and recovery discipline.',
    rewardTitle: 'Vanguard of Power',
    rewardBadge: 'Power Cup',
    flair: 'pauldrons',
    bonusPercent: 5,
    requiredCount: 4,
    allowedQuestTypes: ['daily', 'side', 'boss'],
  },
  focus: {
    id: 'focus',
    label: 'Focus',
    stats: ['intelligence', 'dexterity'],
    focus: 'deep work, precision, and clean execution',
    vow: 'Protect attention. Move with precision. Finish what matters most.',
    summary: 'Focus weeks reward study, flow, and meaningful output without distraction.',
    rewardTitle: 'Sage of Focus',
    rewardBadge: 'Focus Cup',
    flair: 'circlet',
    bonusPercent: 5,
    requiredCount: 4,
    allowedQuestTypes: ['daily', 'side', 'boss'],
  },
  support: {
    id: 'support',
    label: 'Support',
    stats: ['charisma', 'willpower'],
    focus: 'steady discipline, support, and emotional leadership',
    vow: 'Hold the line. Lift others. Build trust through steady action.',
    summary: 'Support weeks reward consistency, social care, and calm leadership under pressure.',
    rewardTitle: 'Warden of Support',
    rewardBadge: 'Support Cup',
    flair: 'mantle',
    bonusPercent: 5,
    requiredCount: 4,
    allowedQuestTypes: ['daily', 'side', 'boss'],
  },
};

function startOfLocalWeek(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - day);
  return normalized;
}

export function getCurrentWeekKey(now = new Date()): string {
  return startOfLocalWeek(now).toISOString().split('T')[0];
}

export function getWeekKeyForIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getCurrentWeekKey(date);
}

export function isCurrentWeek(weekKey: string | null | undefined, now = new Date()): boolean {
  return !!weekKey && weekKey === getCurrentWeekKey(now);
}

export function getActiveWeeklyPath(settings: WeeklyPathSettingsLike, now = new Date()): WeeklyPath | null {
  if (!settings.weeklyPath || !isCurrentWeek(settings.weeklyPathWeekKey, now)) {
    return null;
  }

  return settings.weeklyPath;
}

export function getWeeklyPathDefinition(path: WeeklyPath): WeeklyPathDefinition {
  return WEEKLY_PATHS[path];
}

export function isQuestAlignedToWeeklyPath(path: WeeklyPath, quest: Pick<Quest, 'stat' | 'type'>): boolean {
  const definition = getWeeklyPathDefinition(path);
  return definition.stats.includes(quest.stat) && definition.allowedQuestTypes.includes(quest.type);
}

export function getWeeklyPathQuestBonus(
  settings: WeeklyPathSettingsLike,
  quest: Pick<Quest, 'stat' | 'type'>,
  now = new Date(),
): number {
  const path = getActiveWeeklyPath(settings, now);
  if (!path) return 0;
  return isQuestAlignedToWeeklyPath(path, quest) ? getWeeklyPathDefinition(path).bonusPercent : 0;
}

export function buildWeeklyCupSummary(
  settings: WeeklyPathSettingsLike,
  quests: Quest[],
  currentStreak: number,
  completedMatches: number,
  requiredCount: number,
  now = new Date(),
): WeeklyCupSummary | null {
  const path = getActiveWeeklyPath(settings, now);
  if (!path) return null;

  const definition = getWeeklyPathDefinition(path);
  const contractProgress = Math.min(60, Math.round((completedMatches / Math.max(requiredCount, 1)) * 60));
  const alignedBosses = quests.filter((quest) => quest.type === 'boss' && isQuestAlignedToWeeklyPath(path, quest));
  const bossProgress = Math.min(
    20,
    Math.round(
      alignedBosses.reduce((sum, quest) => sum + ((quest.completedSteps ?? 0) / Math.max(quest.totalSteps ?? 1, 1)) * 20, 0),
    ),
  );
  const streakBoost = Math.min(10, currentStreak);
  const rewardBoost = settings.weeklyRewardWeekKey === settings.weeklyPathWeekKey ? 10 : 0;
  const score = Math.min(100, contractProgress + bossProgress + streakBoost + rewardBoost);

  const rank: WeeklyCupSummary['rank'] =
    score >= 85 ? 'mythic' : score >= 65 ? 'gold' : score >= 40 ? 'silver' : 'bronze';

  return {
    label: `${definition.label} Cup`,
    score,
    rank,
    contractProgress,
    bossProgress,
    streakBoost,
  };
}
