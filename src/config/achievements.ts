import { Hero, Quest } from '../types';
import { WeeklyPathSettingsLike } from './weeklyPaths';
import { WeeklyContract } from './classContracts';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'mythic';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
}

export interface EarnedAchievement extends AchievementDefinition {
  earnedAt: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'first_quest', title: 'First Blood', description: 'Complete your first quest.', icon: '⚔️', tier: 'bronze' },
  { id: 'quests_10', title: 'Steady Blade', description: 'Complete 10 quests.', icon: '🗡️', tier: 'bronze' },
  { id: 'quests_50', title: 'Quest Veteran', description: 'Complete 50 quests.', icon: '🏅', tier: 'silver' },
  { id: 'quests_100', title: 'Legend in Motion', description: 'Complete 100 quests.', icon: '👑', tier: 'gold' },
  { id: 'streak_7', title: 'Week Warden', description: 'Reach a 7-day streak.', icon: '🔥', tier: 'bronze' },
  { id: 'streak_30', title: 'Monthly Master', description: 'Reach a 30-day streak.', icon: '💫', tier: 'silver' },
  { id: 'streak_90', title: 'Iron Habit', description: 'Reach a 90-day streak.', icon: '⚡', tier: 'gold' },
  { id: 'streak_365', title: 'Yearly Legend', description: 'Reach a 365-day streak.', icon: '🌟', tier: 'mythic' },
  { id: 'skills_3', title: 'Skill Seeker', description: 'Unlock 3 skills.', icon: '✦', tier: 'bronze' },
  { id: 'skills_10', title: 'Build Crafter', description: 'Unlock 10 skills.', icon: '✨', tier: 'silver' },
  { id: 'skills_20', title: 'Master of Arts', description: 'Unlock 20 skills.', icon: '🔮', tier: 'gold' },
  { id: 'tier_2', title: 'Class Evolved', description: 'Reach class tier 2.', icon: '🛡️', tier: 'bronze' },
  { id: 'tier_3', title: 'Rising Champion', description: 'Reach class tier 3.', icon: '🏆', tier: 'silver' },
  { id: 'tier_5', title: 'Mythic Class', description: 'Reach class tier 5.', icon: '💎', tier: 'mythic' },
  { id: 'hero_level_10', title: 'Seasoned Hero', description: 'Reach hero level 10.', icon: '⭐', tier: 'bronze' },
  { id: 'hero_level_30', title: 'Veteran Adventurer', description: 'Reach hero level 30.', icon: '🌙', tier: 'silver' },
  { id: 'hero_level_50', title: 'Paragon', description: 'Reach hero level 50.', icon: '☀️', tier: 'gold' },
  { id: 'boss_cleared', title: 'Boss Slayer', description: 'Complete a boss quest.', icon: '🐉', tier: 'silver' },
  { id: 'all_stats_3', title: 'Well Rounded', description: 'Reach level 3 in every stat.', icon: '⚖️', tier: 'silver' },
  { id: 'weekly_contract', title: 'Contract Keeper', description: 'Complete a weekly contract.', icon: '📜', tier: 'gold' },
  { id: 'forged_skill', title: 'Artificer', description: 'Forge an AI skill.', icon: '🔨', tier: 'gold' },
  { id: 'login_30', title: 'Dedicated Adventurer', description: 'Log in 30 days.', icon: '📅', tier: 'bronze' },
  { id: 'raid_clear', title: 'Raid Victor', description: 'Clear a party raid with your guild.', icon: '🛡️', tier: 'gold' },
  { id: 'raid_contributor', title: 'Raid Contributor', description: 'Contribute at least 20% of a raid goal.', icon: '🪓', tier: 'bronze' },
  { id: 'raid_pillar', title: 'Raid Pillar', description: 'Contribute at least 40% of a raid goal.', icon: '🏛️', tier: 'silver' },
  { id: 'raid_legend', title: 'Raid Legend', description: 'Contribute 200+ total across party raids.', icon: '⚔️', tier: 'mythic' },
];

export const EQUIPPABLE_TITLES: { id: string; label: string; condition: string }[] = [
  { id: 'adventurer', label: 'Humble Adventurer', condition: 'Default title' },
  { id: 'streak_warden', label: 'Streak Warden', condition: '30-day streak' },
  { id: 'mythic_pusher', label: 'Mythic Pusher', condition: 'Complete a legendary quest' },
  { id: 'sage_of_focus', label: 'Sage of Focus', condition: 'Complete Focus weekly path' },
  { id: 'vanguard_power', label: 'Vanguard of Power', condition: 'Complete Power weekly path' },
  { id: 'warden_support', label: 'Warden of Support', condition: 'Complete Support weekly path' },
  { id: 'class_keeper', label: 'Class Keeper', condition: 'Complete class contract' },
  { id: 'boss_slayer', label: 'Boss Slayer', condition: 'Clear a boss arc' },
  { id: 'yearly_legend', label: 'Yearly Legend', condition: '365-day streak' },
  { id: 'paragon', label: 'Paragon', condition: 'Hero level 50' },
  { id: 'raid_victor', label: 'Raid Victor', condition: 'Clear a party raid' },
  { id: 'raid_pillar', label: 'Raid Pillar', condition: 'Contribute 40% of a raid goal' },
];

interface AchievementContext {
  hero: Hero;
  unlockedSkillCount: number;
  forgedSkillCount: number;
  completedBossCount: number;
  hasLegendaryQuest: boolean;
  weeklyContractsCompleted: number;
  weeklyRewardTitles: string[];
  raidsCleared: number;
  raidTotalContribution: number;
  raidBestContributionShare: number;
}

function isUnlocked(definition: AchievementDefinition, ctx: AchievementContext): boolean {
  const { hero } = ctx;
  switch (definition.id) {
    case 'first_quest':
      return hero.totalQuestsCompleted >= 1;
    case 'quests_10':
      return hero.totalQuestsCompleted >= 10;
    case 'quests_50':
      return hero.totalQuestsCompleted >= 50;
    case 'quests_100':
      return hero.totalQuestsCompleted >= 100;
    case 'streak_7':
      return hero.longestStreak >= 7;
    case 'streak_30':
      return hero.longestStreak >= 30;
    case 'streak_90':
      return hero.longestStreak >= 90;
    case 'streak_365':
      return hero.longestStreak >= 365;
    case 'skills_3':
      return ctx.unlockedSkillCount >= 3;
    case 'skills_10':
      return ctx.unlockedSkillCount >= 10;
    case 'skills_20':
      return ctx.unlockedSkillCount >= 20;
    case 'tier_2':
      return hero.classTier >= 2;
    case 'tier_3':
      return hero.classTier >= 3;
    case 'tier_5':
      return hero.classTier >= 5;
    case 'hero_level_10':
      return hero.heroLevel >= 10;
    case 'hero_level_30':
      return hero.heroLevel >= 30;
    case 'hero_level_50':
      return hero.heroLevel >= 50;
    case 'boss_cleared':
      return ctx.completedBossCount >= 1;
    case 'all_stats_3':
      return Object.values(hero.stats).every((level) => level >= 3);
    case 'weekly_contract':
      return ctx.weeklyContractsCompleted >= 1;
    case 'forged_skill':
      return ctx.forgedSkillCount >= 1;
    case 'login_30':
      return hero.totalLoginDays >= 30;
    case 'raid_clear':
      return ctx.raidsCleared >= 1;
    case 'raid_contributor':
      return ctx.raidBestContributionShare >= 0.2;
    case 'raid_pillar':
      return ctx.raidBestContributionShare >= 0.4;
    case 'raid_legend':
      return ctx.raidTotalContribution >= 200;
    default:
      return false;
  }
}

export function getEarnedAchievements(ctx: AchievementContext): EarnedAchievement[] {
  const now = new Date().toISOString();
  return ACHIEVEMENT_DEFINITIONS.filter((def) => isUnlocked(def, ctx)).map((def) => ({
    ...def,
    earnedAt: now,
  }));
}

export function getUnlockedTitleIds(ctx: AchievementContext): string[] {
  const ids = ['adventurer'];
  if (ctx.hero.longestStreak >= 30) ids.push('streak_warden');
  if (ctx.hasLegendaryQuest) ids.push('mythic_pusher');
  if (ctx.weeklyRewardTitles.some((t) => t.includes('Focus'))) ids.push('sage_of_focus');
  if (ctx.weeklyRewardTitles.some((t) => t.includes('Power'))) ids.push('vanguard_power');
  if (ctx.weeklyRewardTitles.some((t) => t.includes('Support'))) ids.push('warden_support');
  if (ctx.weeklyContractsCompleted >= 1) ids.push('class_keeper');
  if (ctx.completedBossCount >= 1) ids.push('boss_slayer');
  if (ctx.hero.longestStreak >= 365) ids.push('yearly_legend');
  if (ctx.hero.heroLevel >= 50) ids.push('paragon');
  if (ctx.raidsCleared >= 1) ids.push('raid_victor');
  if (ctx.raidBestContributionShare >= 0.4) ids.push('raid_pillar');
  return ids;
}

export function buildAchievementContext(
  hero: Hero,
  quests: Quest[],
  unlockedSkillCount: number,
  forgedSkillCount: number,
  settings: WeeklyPathSettingsLike & { weeklyRewardTitle?: string | null },
  contractsCompleted = 0,
  raidStats: {
    raidsCleared?: number;
    totalContribution?: number;
    bestContributionShare?: number;
  } = {},
): AchievementContext {
  return {
    hero,
    unlockedSkillCount,
    forgedSkillCount,
    completedBossCount: quests.filter((q) => q.type === 'boss' && q.isCompleted).length,
    hasLegendaryQuest: quests.some((q) => q.difficulty === 'legendary' && q.isCompleted),
    weeklyContractsCompleted: contractsCompleted,
    weeklyRewardTitles: settings.weeklyRewardTitle ? [settings.weeklyRewardTitle] : [],
    raidsCleared: raidStats.raidsCleared ?? 0,
    raidTotalContribution: raidStats.totalContribution ?? 0,
    raidBestContributionShare: raidStats.bestContributionShare ?? 0,
  };
}

export function isQuestContractAligned(quest: Quest, contract: WeeklyContract): boolean {
  if (contract.kind === 'weeklyPath') {
    return contract.stats.includes(quest.stat);
  }
  return contract.recommended.some((template) => template.title === quest.title);
}
