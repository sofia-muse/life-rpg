import { StatName } from '../../types';
import { calculateHeroLevel, getDominantStat, getStatLevels, checkTierUp } from '../statEngine';
import {
  getStreakMultiplier,
  shouldResetStreak,
  getStreakAfterBreak,
  getNextMilestone,
} from '../streakEngine';
import { getNewlyUnlockedSkills, getSkillBonusForStat, isSkillUnlockable } from '../skillEngine';
import { checkClassEvolution } from '../classEngine';
import { getSkillById } from '../../config/skills';

const xp = (over: Partial<Record<StatName, number>> = {}): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
  ...over,
});

describe('statEngine', () => {
  it('getDominantStat picks highest XP, strength wins ties (first scanned)', () => {
    expect(getDominantStat(xp({ strength: 500, vitality: 500 }))).toBe('strength');
    expect(getDominantStat(xp({ intelligence: 1000, strength: 999 }))).toBe('intelligence');
  });

  it('calculateHeroLevel is at least 1 for a fresh hero', () => {
    expect(calculateHeroLevel(xp())).toBe(1);
  });

  it('getStatLevels maps XP to per-stat levels', () => {
    const levels = getStatLevels(xp({ strength: 100 }));
    expect(levels.strength).toBe(1);
    expect(levels.vitality).toBe(0);
  });

  it('checkTierUp returns a tier when hero level crosses a threshold', () => {
    expect(checkTierUp(1, 5, 'strength')).toMatchObject({ shouldTierUp: true, newTier: 2 });
    expect(checkTierUp(2, 4, 'strength')).toBeNull();
  });
});

describe('streakEngine', () => {
  it.each([
    [0, 1.0],
    [2, 1.0],
    [3, 1.1],
    [7, 1.2],
    [29, 1.3],
    [30, 1.5],
    [400, 3.0],
  ])('getStreakMultiplier(%i) = %f', (days, mult) => {
    expect(getStreakMultiplier(days)).toBe(mult);
  });

  it('shouldResetStreak is true only when more than one day is missed', () => {
    expect(shouldResetStreak('2026-06-04', '2026-06-04')).toBe(false);
    expect(shouldResetStreak('2026-06-03', '2026-06-04')).toBe(false);
    expect(shouldResetStreak('2026-06-02', '2026-06-04')).toBe(true);
  });

  it('getStreakAfterBreak keeps 50% with Regeneration, else 0', () => {
    expect(getStreakAfterBreak(10, true)).toBe(5);
    expect(getStreakAfterBreak(10, false)).toBe(0);
  });

  it('getNextMilestone returns null past the final milestone', () => {
    expect(getNextMilestone(400)).toBeNull();
    expect(getNextMilestone(0)?.days).toBe(3);
  });
});

describe('skillEngine', () => {
  it('unlocks the first strength skill at level 3', () => {
    const unlocked = getNewlyUnlockedSkills(xp({ strength: 901 }), []);
    const ids = unlocked.map((s) => s.id);
    expect(ids).toContain('str-1');
    expect(ids).not.toContain('str-2');
  });

  it('skips already-unlocked skills', () => {
    const unlocked = getNewlyUnlockedSkills(xp({ strength: 901 }), ['str-1']);
    expect(unlocked.map((s) => s.id)).not.toContain('str-1');
  });

  it('cross-stat skill requires both stats', () => {
    expect(getNewlyUnlockedSkills(xp({ strength: 2819 }), []).map((s) => s.id)).not.toContain(
      'cross-1',
    );
    expect(
      getNewlyUnlockedSkills(xp({ strength: 2819, intelligence: 2819 }), []).map((s) => s.id),
    ).toContain('cross-1');
  });

  it('getSkillBonusForStat parses +X% from the effect', () => {
    expect(getSkillBonusForStat('strength', ['str-1'])).toBe(5);
    expect(getSkillBonusForStat('vitality', ['str-1'])).toBe(0);
  });

  it('Zen Master (cross-6) applies to all stats', () => {
    (
      ['strength', 'vitality', 'intelligence', 'charisma', 'dexterity', 'willpower'] as StatName[]
    ).forEach((stat) => expect(getSkillBonusForStat(stat, ['cross-6'])).toBe(3));
  });

  it('isSkillUnlockable matches the unlock list', () => {
    const ironGrip = getSkillById('str-1')!;
    expect(isSkillUnlockable(ironGrip, xp({ strength: 901 }))).toBe(true);
    expect(isSkillUnlockable(ironGrip, xp({ strength: 100 }))).toBe(false);
  });
});

describe('classEngine', () => {
  it('tiers up when hero level crosses a threshold', () => {
    const evo = checkClassEvolution(
      xp({
        strength: 2819,
        vitality: 2819,
        intelligence: 2819,
        charisma: 2819,
        dexterity: 2819,
        willpower: 2819,
      }),
      1,
      'Apprentice Warrior',
    );
    expect(evo).toMatchObject({ newTier: 2, newClass: 'Warrior' });
  });

  it('changes class on dominant-stat shift at the same tier', () => {
    const evo = checkClassEvolution(xp({ intelligence: 200 }), 1, 'Apprentice Warrior');
    expect(evo).toMatchObject({
      newTier: 1,
      newClass: 'Apprentice Scholar',
      dominantStat: 'intelligence',
    });
  });

  it('returns null when tier and class are unchanged', () => {
    expect(checkClassEvolution(xp({ strength: 200 }), 1, 'Apprentice Warrior')).toBeNull();
  });
});
