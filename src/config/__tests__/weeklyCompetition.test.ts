import { getPrimaryContract, getWeeklyPathContract } from '../classContracts';
import {
  buildWeeklyChallengePayload,
  formatWeeklyChallenge,
  formatWeeklySnapshot,
  getRewardStatusCopy,
} from '../weeklyCompetition';
import { getCurrentWeekKey, WeeklyPathSettingsLike } from '../weeklyPaths';
import { Hero, Quest } from '../../types';

function buildHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'hero-1',
    name: 'Aria',
    avatarSeed: 'aria',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    stats: {
      strength: 1,
      vitality: 1,
      intelligence: 1,
      charisma: 1,
      dexterity: 1,
      willpower: 1,
    },
    statXP: {
      strength: 0,
      vitality: 0,
      intelligence: 0,
      charisma: 0,
      dexterity: 0,
      willpower: 0,
    },
    heroLevel: 8,
    className: 'Warrior',
    classTier: 2,
    dominantStat: 'strength',
    totalQuestsCompleted: 0,
    currentStreak: 6,
    longestStreak: 6,
    lastActiveDate: '2026-01-01',
    restDaysUsed: 0,
    appearance: {
      crestShape: 'shield',
      sigil: 'sword',
      accentOverride: 'none',
      titleDisplay: true,
      unlockedCrestShapes: ['shield'],
      unlockedSigils: ['sword'],
    },
    characterAppearance: {
      gender: 'female',
      skinTone: 2,
      hairStyle: 'long',
      hairColor: 1,
      eyeStyle: 'oval',
      mouthStyle: 'smile',
      glassesStyle: 'none',
      classFlair: 'auto',
    } as Hero['characterAppearance'],
    lastRewardDate: '',
    totalLoginDays: 0,
    ...overrides,
  };
}

function buildQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest-1',
    title: 'Quest',
    description: '',
    type: 'side',
    difficulty: 'medium',
    stat: 'strength',
    xpReward: 25,
    isCompleted: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    streak: 0,
    bestStreak: 0,
    daysCompleted: 0,
    ...overrides,
  };
}

function buildSettings(overrides: Partial<WeeklyPathSettingsLike> = {}): WeeklyPathSettingsLike {
  return {
    weeklyPath: null,
    weeklyPathWeekKey: null,
    weeklyPathStartedAt: null,
    weeklyRewardWeekKey: null,
    weeklyRewardTitle: null,
    weeklyRewardBadge: null,
    ...overrides,
  };
}

function buildWeekDates() {
  const weekKey = getCurrentWeekKey();
  const currentWeekCompletedAt = new Date(`${weekKey}T12:00:00.000Z`).toISOString();
  const priorWeek = new Date(currentWeekCompletedAt);
  priorWeek.setUTCDate(priorWeek.getUTCDate() - 7);
  return {
    weekKey,
    currentWeekCompletedAt,
    priorWeekCompletedAt: priorWeek.toISOString(),
  };
}

describe('weekly competition helpers', () => {
  it('builds weekly contracts from aligned active quests and current-week completions only', () => {
    const hero = buildHero();
    const { weekKey, currentWeekCompletedAt, priorWeekCompletedAt } = buildWeekDates();
    const settings = buildSettings({
      weeklyPath: 'power',
      weeklyPathWeekKey: weekKey,
      weeklyPathStartedAt: currentWeekCompletedAt,
    });

    const contract = getWeeklyPathContract(hero, settings, [
      buildQuest({ id: 'active-strength', type: 'daily', stat: 'strength', isActive: true }),
      buildQuest({
        id: 'completed-vitality',
        stat: 'vitality',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
      buildQuest({
        id: 'completed-old-week',
        stat: 'strength',
        isCompleted: true,
        isActive: false,
        completedAt: priorWeekCompletedAt,
      }),
      buildQuest({
        id: 'completed-other-stat',
        stat: 'charisma',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
    ]);

    expect(contract).not.toBeNull();
    expect(contract).toMatchObject({
      title: 'Power Path',
      activeMatches: 1,
      completedMatches: 1,
      stats: ['strength', 'vitality'],
      reward: {
        title: 'Vanguard of Power',
        badge: 'Power Cup',
      },
    });
  });

  it('falls back to the class contract when the weekly path is stale', () => {
    const hero = buildHero({ dominantStat: 'strength', className: 'Warrior' });
    const contract = getPrimaryContract(
      hero,
      buildSettings({
        weeklyPath: 'power',
        weeklyPathWeekKey: '1999-01-04',
        weeklyPathStartedAt: '1999-01-04T00:00:00.000Z',
      }),
      [buildQuest({ title: '20 Push-ups', type: 'daily', isActive: true })],
    );

    expect(contract.kind).toBe('class');
    expect(contract.title).toBe('Forge of Iron');
    expect(contract.reward.title).toBe('Warrior Keeper');
    expect(contract.reward.badge).toBe('Class Contract');
  });

  it('builds weekly challenge payloads, formatting, and reward status copy', () => {
    const hero = buildHero({
      name: 'Nova',
      className: 'Spellblade',
      currentStreak: 10,
      dominantStat: 'intelligence',
    });
    const { weekKey, currentWeekCompletedAt } = buildWeekDates();
    const settings = buildSettings({
      weeklyPath: 'focus',
      weeklyPathWeekKey: weekKey,
      weeklyPathStartedAt: currentWeekCompletedAt,
    });
    const quests = [
      buildQuest({
        id: 'focus-1',
        title: 'Read for 30 Minutes',
        type: 'daily',
        stat: 'intelligence',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
      buildQuest({
        id: 'focus-2',
        title: 'Single-Task for 45 Minutes',
        stat: 'dexterity',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
      buildQuest({
        id: 'focus-3',
        title: 'Take an Online Course Lesson',
        stat: 'intelligence',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
      buildQuest({
        id: 'focus-4',
        title: 'Complete a Side Project Milestone',
        stat: 'dexterity',
        isCompleted: true,
        isActive: false,
        completedAt: currentWeekCompletedAt,
      }),
      buildQuest({
        id: 'focus-boss',
        title: 'Ship a Project',
        type: 'boss',
        stat: 'dexterity',
        totalSteps: 6,
        completedSteps: 3,
      }),
    ];

    const contract = getWeeklyPathContract(hero, settings, quests);
    expect(contract).not.toBeNull();
    if (!contract) {
      throw new Error('Expected an active weekly contract.');
    }

    const payload = buildWeeklyChallengePayload(hero, settings, contract, quests);
    expect(payload).toMatchObject({
      heroName: 'Nova',
      className: 'Spellblade',
      pathLabel: 'Focus',
      contractTitle: 'Focus Path',
      cupScore: 80,
      cupRank: 'gold',
      completedMatches: 4,
      requiredCount: 4,
      bossProgressLabel: '3/6',
      rewardTitle: 'Sage of Focus',
      rewardBadge: 'Focus Cup',
    });

    expect(formatWeeklySnapshot(payload!)).toContain('Cup score: 80 (gold)');
    expect(formatWeeklyChallenge(payload!)).toContain('Goal: beat 80 cup points and clear 4/4 aligned quests.');

    expect(getRewardStatusCopy(contract, settings)).toEqual({
      readyToClaim: true,
      label: 'Sage of Focus',
    });
    expect(
      getRewardStatusCopy(contract, {
        ...settings,
        weeklyRewardWeekKey: weekKey,
        weeklyRewardTitle: 'Sage of Focus',
      }),
    ).toEqual({
      readyToClaim: false,
      label: 'Sage of Focus',
    });
  });
});
