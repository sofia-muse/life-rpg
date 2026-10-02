import { calendarToday, daysBetween } from '../calendar';
import { resolveRestDay } from '../restDay';
import { bossStepXpShare } from '../xpEngine';

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

describe('boss step share', () => {
  it('splits the reward and gives the remainder to the last step', () => {
    expect(bossStepXpShare(50, 2, 1)).toBe(25);
    expect(bossStepXpShare(50, 2, 2)).toBe(25);
    expect(bossStepXpShare(50, 3, 1)).toBe(16);
    expect(bossStepXpShare(50, 3, 3)).toBe(18);
  });
});
