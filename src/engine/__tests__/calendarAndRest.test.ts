import { calendarToday, calendarWeekKey, daysBetween } from '../calendar';
import { resolveRestDay } from '../restDay';
import { appendCompletionLog, mergeCompletionLogs } from '../completionLog';
import { advanceTrackedStreak } from '../streakEngine';
import { bossStepXpShare, takeDailyXpPayout, takeSideBossPayout } from '../xpEngine';

describe('calendar', () => {
  it('rolls the day at local midnight, not UTC', () => {
    const instant = new Date('2026-06-04T22:00:00.000Z');
    expect(calendarToday('UTC', instant)).toBe('2026-06-04');
    expect(calendarToday('Europe/Moscow', instant)).toBe('2026-06-05');
  });

  it('counts calendar days without timezone drift', () => {
    expect(daysBetween('2026-06-02', '2026-06-04')).toBe(2);
    expect(daysBetween('2026-06-04', '2026-06-04')).toBe(0);
  });
});

describe('rest day', () => {
  it('continues the streak and scales vitality XP', () => {
    const decision = resolveRestDay({
      currentStreak: 4,
      longestStreak: 4,
      lastActiveDate: '2026-06-03',
      recentRestDates: [],
      restDaysUsed: 0,
      today: '2026-06-04',
      vitalityLevel: 3,
      unlockedSkillIds: ['vit-1'],
      baseRestXp: 15,
    });

    expect(decision.granted).toBe(true);
    expect(decision.currentStreak).toBe(5);
    expect(decision.xp).toBe(18);
    expect(decision.recentRestDates).toEqual(['2026-06-04']);
  });

  it('starts a streak when the hero rests on the day they were created', () => {
    const decision = resolveRestDay({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '2026-06-04',
      recentRestDates: [],
      restDaysUsed: 0,
      today: '2026-06-04',
      vitalityLevel: 0,
      unlockedSkillIds: [],
      baseRestXp: 10,
    });

    expect(decision.granted).toBe(true);
    expect(decision.currentStreak).toBe(1);
    expect(decision.xp).toBe(10);
  });

  it('refuses a second rest inside the weekly allowance', () => {
    const decision = resolveRestDay({
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: '2026-06-04',
      recentRestDates: ['2026-06-04'],
      restDaysUsed: 1,
      today: '2026-06-05',
      vitalityLevel: 3,
      unlockedSkillIds: [],
      baseRestXp: 10,
    });

    expect(decision.granted).toBe(false);
    expect(decision.currentStreak).toBe(5);
  });
});

describe('hero return day', () => {
  it('counts the return as streak 1, keeps a freeze, and floors retention at 1', () => {
    const broken = advanceTrackedStreak({
      currentStreak: 6,
      lastDate: '2026-06-01',
      today: '2026-06-04',
      unlockedSkillIds: [],
      brokenDayCounts: true,
    });
    expect(broken.streak).toBe(1);
    expect(broken.usedFreeze).toBe(false);

    const frozen = advanceTrackedStreak({
      currentStreak: 6,
      lastDate: '2026-06-01',
      today: '2026-06-04',
      unlockedSkillIds: ['wil-2'],
      brokenDayCounts: true,
    });
    expect(frozen.streak).toBe(6);
    expect(frozen.usedFreeze).toBe(true);

    const retained = advanceTrackedStreak({
      currentStreak: 1,
      lastDate: '2026-06-01',
      today: '2026-06-04',
      unlockedSkillIds: ['vit-2'],
      lastStreakFreezeDate: '2026-06-04',
      brokenDayCounts: true,
    });
    expect(retained.streak).toBe(1);
    expect(retained.usedFreeze).toBe(false);
  });
});

describe('completion log', () => {
  it('keeps one row per quest per day and drops anything older than three weeks', () => {
    const once = appendCompletionLog(undefined, { questId: 'daily-1', date: '2026-06-04', stat: 'strength' });
    const twice = appendCompletionLog(once, { questId: 'daily-1', date: '2026-06-04', stat: 'strength' });
    const kept = appendCompletionLog(twice, { questId: 'daily-1', date: '2026-06-26', stat: 'strength' });
    expect(twice).toHaveLength(1);
    expect(kept.map((entry) => entry.date)).toEqual(['2026-06-26']);
  });

  it('keeps the local log when the server sends nothing', () => {
    const local = [{ questId: 'daily-1', date: '2026-06-04', stat: 'strength' as const }];
    expect(mergeCompletionLogs(local, undefined)).toEqual(local);
    expect(mergeCompletionLogs(local, [])).toEqual(local);
    expect(mergeCompletionLogs(local, [{ questId: 'daily-2', date: '2026-06-05', stat: 'vitality' }])).toEqual([
      local[0],
      { questId: 'daily-2', date: '2026-06-05', stat: 'vitality' },
    ]);
  });
});

describe('quest streak', () => {
  it('continues on the next day and starts over after a gap', () => {
    const continued = advanceTrackedStreak({
      currentStreak: 4,
      lastDate: '2026-06-03',
      today: '2026-06-04',
      unlockedSkillIds: [],
      missingDateStartsAtOne: true,
      brokenDayCounts: true,
    });
    expect(continued.streak).toBe(5);

    const broken = advanceTrackedStreak({
      currentStreak: 4,
      lastDate: '2026-06-01',
      today: '2026-06-04',
      unlockedSkillIds: [],
      missingDateStartsAtOne: true,
      brokenDayCounts: true,
    });
    expect(broken.streak).toBe(1);
    expect(broken.usedFreeze).toBe(false);
  });

  it('keeps the chain when a freeze is available', () => {
    const frozen = advanceTrackedStreak({
      currentStreak: 9,
      lastDate: '2026-05-30',
      today: '2026-06-04',
      unlockedSkillIds: ['wil-2'],
      missingDateStartsAtOne: true,
      brokenDayCounts: true,
    });
    expect(frozen.streak).toBe(9);
    expect(frozen.usedFreeze).toBe(true);
    expect(frozen.lastStreakFreezeDate).toBe('2026-06-04');
  });
});

describe('daily xp budget', () => {
  it('pays the slot count and resets the next day', () => {
    const first = takeDailyXpPayout(undefined, 0, '2026-06-04', 3);
    const second = takeDailyXpPayout(first.payoutDate, first.payoutsUsed, '2026-06-04', 3);
    const third = takeDailyXpPayout(second.payoutDate, second.payoutsUsed, '2026-06-04', 3);
    const fourth = takeDailyXpPayout(third.payoutDate, third.payoutsUsed, '2026-06-04', 3);
    const nextDay = takeDailyXpPayout(fourth.payoutDate, fourth.payoutsUsed, '2026-06-05', 3);
    expect(first.granted).toBe(true);
    expect(second.granted).toBe(true);
    expect(third.granted).toBe(true);
    expect(third.payoutsUsed).toBe(3);
    expect(fourth.granted).toBe(false);
    expect(fourth.payoutsUsed).toBe(3);
    expect(nextDay.granted).toBe(true);
    expect(nextDay.payoutsUsed).toBe(1);
  });
});

describe('side and boss payout budget', () => {
  it('grants two payouts per calendar day', () => {
    const first = takeSideBossPayout(undefined, 0, '2026-06-04', 'side-a', false);
    const second = takeSideBossPayout(first.payoutDate, first.payoutsUsed, '2026-06-04', 'side-b', false, first.openBossIds);
    const third = takeSideBossPayout(second.payoutDate, second.payoutsUsed, '2026-06-04', 'side-c', false, second.openBossIds);
    const nextDay = takeSideBossPayout(third.payoutDate, third.payoutsUsed, '2026-06-05', 'side-d', false, third.openBossIds);
    expect(first.granted).toBe(true);
    expect(second.granted).toBe(true);
    expect(third.granted).toBe(false);
    expect(nextDay.granted).toBe(true);
    expect(nextDay.payoutsUsed).toBe(1);
  });

  it('spends one payout for a whole boss arc', () => {
    const first = takeSideBossPayout(undefined, 0, '2026-06-04', 'boss-1', true);
    const second = takeSideBossPayout(first.payoutDate, first.payoutsUsed, '2026-06-04', 'boss-1', true, first.openBossIds);
    const side = takeSideBossPayout(second.payoutDate, second.payoutsUsed, '2026-06-04', 'side-a', false, second.openBossIds);
    const extra = takeSideBossPayout(side.payoutDate, side.payoutsUsed, '2026-06-04', 'side-b', false, side.openBossIds);
    expect(first.granted).toBe(true);
    expect(first.payoutsUsed).toBe(1);
    expect(second.granted).toBe(true);
    expect(second.payoutsUsed).toBe(1);
    expect(side.granted).toBe(true);
    expect(side.payoutsUsed).toBe(2);
    expect(extra.granted).toBe(false);
  });
});

describe('calendar week', () => {
  it('starts the week on Monday in the hero zone', () => {
    const instant = new Date('2026-06-07T22:00:00.000Z');
    expect(calendarWeekKey('UTC', instant)).toBe('2026-06-01');
    expect(calendarWeekKey('Europe/Moscow', instant)).toBe('2026-06-08');
  });
});

describe('boss step share', () => {
  it('splits the reward and gives the remainder to the last step', () => {
    expect(bossStepXpShare(50, 2, 1)).toBe(25);
    expect(bossStepXpShare(50, 2, 2)).toBe(25);
    expect(bossStepXpShare(50, 3, 1)).toBe(16);
    expect(bossStepXpShare(50, 3, 3)).toBe(18);
  });
});
