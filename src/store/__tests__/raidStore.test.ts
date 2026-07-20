import { computePersonalStats, emptyRaidPersonal } from '../raidStore';
import { RaidDto } from '../../api/raidApi';
import {
  buildAchievementContext,
  getEarnedAchievements,
  getUnlockedTitleIds,
} from '../../config/achievements';
import { Hero, Quest } from '../../types';

function makeRaid(overrides: Partial<RaidDto> = {}): RaidDto {
  return {
    id: 'raid-1',
    title: 'Iron Push',
    description: 'Pool push-ups',
    sagaTitle: "The Iron Legion's Trial",
    rewardTitle: 'Iron Cohort',
    unitLabel: 'push-ups',
    targetAmount: 100,
    currentAmount: 100,
    stat: 'strength',
    inviteCode: 'IRON-123',
    maxMembers: 8,
    memberCount: 2,
    deadline: null,
    isCompleted: true,
    completedAt: '2026-07-01T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    leaderHeroId: 'h1',
    leaderHeroName: 'Kael',
    yourContribution: 40,
    members: [],
    recentContributions: [],
    ...overrides,
  };
}

describe('computePersonalStats', () => {
  it('tallies cleared raids and contribution share', () => {
    const stats = computePersonalStats([
      makeRaid({ id: 'a', yourContribution: 40, targetAmount: 100, isCompleted: true }),
      makeRaid({
        id: 'b',
        yourContribution: 10,
        targetAmount: 100,
        currentAmount: 10,
        isCompleted: false,
        completedAt: null,
      }),
    ]);

    expect(stats.raidsCleared).toBe(1);
    expect(stats.clearedRaidIds).toEqual(['a']);
    expect(stats.totalContribution).toBe(50);
    expect(stats.bestContributionShare).toBeCloseTo(0.4);
    expect(stats.lastRewardTitle).toBe('Iron Cohort');
  });

  it('starts empty', () => {
    expect(computePersonalStats([])).toEqual(emptyRaidPersonal());
  });
});

describe('raid achievements', () => {
  const hero = {
    id: 'h1',
    name: 'Kael',
    avatarSeed: 'kael',
    createdAt: '2026-01-01',
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
    heroLevel: 1,
    className: 'Novice',
    classTier: 1,
    dominantStat: 'strength',
    totalQuestsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
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
      gender: 'male',
      skinTone: 0,
      hairStyle: 'short',
      hairColor: 0,
      eyeStyle: 'circle',
      mouthStyle: 'smile',
      glassesStyle: 'none',
    },
    lastRewardDate: '',
    totalLoginDays: 0,
  } as Hero;

  it('unlocks shared and personal raid achievements from personal stats', () => {
    const ctx = buildAchievementContext(
      hero,
      [] as Quest[],
      0,
      0,
      {
        weeklyPath: null,
        weeklyPathWeekKey: null,
        weeklyPathStartedAt: null,
        weeklyRewardWeekKey: null,
        weeklyRewardTitle: null,
        weeklyRewardBadge: null,
      },
      0,
      {
        raidsCleared: 1,
        totalContribution: 220,
        bestContributionShare: 0.45,
      },
    );

    const earnedIds = getEarnedAchievements(ctx).map((a) => a.id);
    expect(earnedIds).toEqual(
      expect.arrayContaining(['raid_clear', 'raid_contributor', 'raid_pillar', 'raid_legend']),
    );
    expect(getUnlockedTitleIds(ctx)).toEqual(
      expect.arrayContaining(['raid_victor', 'raid_pillar']),
    );
  });
});
