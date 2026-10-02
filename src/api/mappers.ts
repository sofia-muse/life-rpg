import { ApiHero, ApiQuest } from './dto';
import { Hero, JournalEntry, Quest, StatName } from '../types';
import { generateId } from '../utils/id';

const STAT_NAMES: StatName[] = [
  'strength',
  'vitality',
  'intelligence',
  'charisma',
  'dexterity',
  'willpower',
];

function emptyXpGained(): Record<StatName, number> {
  return {
    strength: 0,
    vitality: 0,
    intelligence: 0,
    charisma: 0,
    dexterity: 0,
    willpower: 0,
  };
}

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

/** Map a journal row from sync `serverChanges.journal` (server is authoritative per date). */
export function mapApiJournalEntry(raw: Record<string, unknown>): JournalEntry | null {
  const dateRaw = raw.date;
  const date =
    typeof dateRaw === 'string'
      ? dateRaw.slice(0, 10)
      : dateRaw != null
        ? String(dateRaw).slice(0, 10)
        : '';
  if (!date) return null;

  const xpGained = emptyXpGained();
  const xpRaw = raw.xpGained;
  if (xpRaw && typeof xpRaw === 'object') {
    for (const stat of STAT_NAMES) {
      const value = (xpRaw as Record<string, unknown>)[stat];
      if (typeof value === 'number') xpGained[stat] = value;
    }
  }

  return {
    id: raw.id != null ? String(raw.id) : generateId(),
    date,
    narrative: typeof raw.narrative === 'string' ? raw.narrative : '',
    questsCompleted: [],
    xpGained,
    levelsGained: Array.isArray(raw.levelsGained) ? (raw.levelsGained as StatName[]) : [],
    skillsUnlocked: [],
    milestones: Array.isArray(raw.milestones) ? (raw.milestones as string[]) : [],
    tomorrowVow:
      typeof raw.tomorrowVow === 'string' || raw.tomorrowVow === null
        ? (raw.tomorrowVow as string | null)
        : undefined,
    tomorrowVowTemplateTitle:
      typeof raw.tomorrowVowTemplateTitle === 'string' ||
      raw.tomorrowVowTemplateTitle === null
        ? (raw.tomorrowVowTemplateTitle as string | null)
        : undefined,
  };
}
