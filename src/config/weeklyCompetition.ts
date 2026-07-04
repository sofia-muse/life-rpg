import { Hero, Quest } from '../types';
import { WeeklyContract, isContractComplete } from './classContracts';
import { WeeklyCupSummary, WeeklyPathSettingsLike, buildWeeklyCupSummary } from './weeklyPaths';

export interface WeeklyChallengePayload {
  heroName: string;
  className: string;
  pathLabel: string;
  contractTitle: string;
  rewardTitle: string;
  rewardBadge: string;
  completedMatches: number;
  requiredCount: number;
  cupScore: number;
  cupRank: WeeklyCupSummary['rank'];
  currentStreak: number;
  bossProgressLabel: string;
}

function getBossProgressLabel(contract: WeeklyContract, quests: Quest[]): string {
  const bossQuest = quests.find(
    (quest) => quest.type === 'boss' && contract.stats.includes(quest.stat) && (quest.totalSteps ?? 0) > 0,
  );

  if (!bossQuest || !bossQuest.totalSteps) {
    return 'No boss arc bound';
  }

  return `${bossQuest.completedSteps ?? 0}/${bossQuest.totalSteps}`;
}

export function buildWeeklyChallengePayload(
  hero: Hero,
  settings: WeeklyPathSettingsLike,
  contract: WeeklyContract,
  quests: Quest[],
): WeeklyChallengePayload | null {
  const cup = buildWeeklyCupSummary(
    settings,
    quests,
    hero.currentStreak,
    contract.completedMatches,
    contract.requiredCount,
  );

  if (!cup) return null;

  return {
    heroName: hero.name,
    className: hero.className,
    pathLabel: contract.path ? `${contract.path[0].toUpperCase()}${contract.path.slice(1)}` : 'Class',
    contractTitle: contract.title,
    rewardTitle: contract.reward.title,
    rewardBadge: contract.reward.badge,
    completedMatches: contract.completedMatches,
    requiredCount: contract.requiredCount,
    cupScore: cup.score,
    cupRank: cup.rank,
    currentStreak: hero.currentStreak,
    bossProgressLabel: getBossProgressLabel(contract, quests),
  };
}

export function formatWeeklySnapshot(payload: WeeklyChallengePayload): string {
  return [
    `Life RPG Weekly Snapshot`,
    ``,
    `${payload.heroName} · ${payload.className}`,
    `Path: ${payload.pathLabel}`,
    `Contract: ${payload.contractTitle}`,
    `Cup score: ${payload.cupScore} (${payload.cupRank})`,
    `Contract progress: ${payload.completedMatches}/${payload.requiredCount}`,
    `Boss progress: ${payload.bossProgressLabel}`,
    `Current streak: ${payload.currentStreak} days`,
    `Reward chase: ${payload.rewardTitle} · ${payload.rewardBadge}`,
  ].join('\n');
}

export function formatWeeklyChallenge(payload: WeeklyChallengePayload): string {
  return [
    `Life RPG Weekly Challenge`,
    ``,
    `${payload.heroName} is running the ${payload.pathLabel} path this week.`,
    `Contract: ${payload.contractTitle}`,
    `Goal: beat ${payload.cupScore} cup points and clear ${payload.completedMatches}/${payload.requiredCount} aligned quests.`,
    `Boss arc: ${payload.bossProgressLabel}`,
    `Reward on the line: ${payload.rewardTitle}`,
  ].join('\n');
}

export function getRewardStatusCopy(
  contract: WeeklyContract,
  settings: WeeklyPathSettingsLike,
): { readyToClaim: boolean; label: string } {
  const alreadyClaimed = settings.weeklyRewardWeekKey === settings.weeklyPathWeekKey;
  if (alreadyClaimed) {
    return { readyToClaim: false, label: settings.weeklyRewardTitle ?? contract.reward.title };
  }

  if (isContractComplete(contract)) {
    return { readyToClaim: true, label: contract.reward.title };
  }

  return { readyToClaim: false, label: contract.reward.title };
}
