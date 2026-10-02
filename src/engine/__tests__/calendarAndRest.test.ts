import { calendarToday, calendarWeekKey, daysBetween } from '../calendar';
import { resolveRestDay } from '../restDay';
import { advanceTrackedStreak } from '../streakEngine';
import { bossStepXpShare, takeSideBossPayout } from '../xpEngine';

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

describe('side and boss payout budget', () => {
  it('grants two payouts per calendar day', () => {
    const first = takeSideBossPayout(undefined, 0, '2026-06-04');
    const second = takeSideBossPayout(first.payoutDate, first.payoutsUsed, '2026-06-04');
    const third = takeSideBossPayout(second.payoutDate, second.payoutsUsed, '2026-06-04');
    const nextDay = takeSideBossPayout(third.payoutDate, third.payoutsUsed, '2026-06-05');
    expect(first.granted).toBe(true);
    expect(second.granted).toBe(true);
    expect(third.granted).toBe(false);
    expect(nextDay.granted).toBe(true);
    expect(nextDay.payoutsUsed).toBe(1);
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
