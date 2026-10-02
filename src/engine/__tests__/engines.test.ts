import { StatName } from '../../types';
import { calculateHeroLevel, getDominantStat, getStatLevels, checkTierUp, resolveClassStat } from '../statEngine';
import {
  getStreakMultiplier,
  getHeroStreakMultiplier,
  shouldResetStreak,
  getStreakAfterBreak,
  getNextMilestone,
} from '../streakEngine';
import {
  getActiveDailyQuestCapacityBonus,
  getNewlyUnlockedSkills,
  getQuestSkillBonus,
  getRestDayXpReward,
  getSkillBonusForStat,
  getStreakRetentionRatio,
  getWeeklyStreakFreezeAllowance,
  isSkillUnlockable,
} from '../skillEngine';
import { checkClassEvolution, respecClassIdentity } from '../classEngine';
import { totalXPForLevel } from '../../config/xpTables';
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
    const levels = getStatLevels(xp({ strength: totalXPForLevel(1) }));
    expect(levels.strength).toBe(1);
    expect(levels.vitality).toBe(0);
  });

  it('resolveClassStat keeps a small lead and yields to a full level', () => {
    expect(resolveClassStat(xp({ strength: 200, intelligence: 210 }), 'strength')).toBe('strength');
    expect(resolveClassStat(xp({ strength: totalXPForLevel(5), intelligence: totalXPForLevel(6) }), 'strength')).toBe(
      'intelligence',
    );
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

  it('hero streak multiplier caps at 1.5', () => {
    expect(getHeroStreakMultiplier(0)).toBe(1);
    expect(getHeroStreakMultiplier(3)).toBe(1.05);
    expect(getHeroStreakMultiplier(365)).toBe(1.5);
    expect(getHeroStreakMultiplier(400)).toBe(1.5);
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
    const unlocked = getNewlyUnlockedSkills(xp({ strength: totalXPForLevel(3) }), []);
    const ids = unlocked.map((s) => s.id);
    expect(ids).toContain('str-1');
    expect(ids).not.toContain('str-2');
  });

  it('skips already-unlocked skills', () => {
    const unlocked = getNewlyUnlockedSkills(xp({ strength: totalXPForLevel(3) }), ['str-1']);
    expect(unlocked.map((s) => s.id)).not.toContain('str-1');
  });

  it('cross-stat skill requires both stats', () => {
    expect(getNewlyUnlockedSkills(xp({ strength: totalXPForLevel(5) }), []).map((s) => s.id)).not.toContain(
      'cross-1',
    );
    expect(
      getNewlyUnlockedSkills(xp({ strength: totalXPForLevel(5), intelligence: totalXPForLevel(5) }), []).map((s) => s.id),
    ).toContain('cross-1');
  });

  it('getSkillBonusForStat parses +X% from the effect', () => {
    expect(getSkillBonusForStat('strength', ['str-1'])).toBe(5);
    expect(getSkillBonusForStat('vitality', ['str-1'])).toBe(0);
  });

  it('applies quest-type skill bonuses with typed effects', () => {
    expect(getQuestSkillBonus({ stat: 'strength', type: 'side' }, ['int-2'])).toBe(10);
    expect(getQuestSkillBonus({ stat: 'charisma', type: 'boss' }, ['cha-2'])).toBe(10);
    expect(getQuestSkillBonus({ stat: 'charisma', type: 'daily' }, ['cha-2'])).toBe(0);
  });

  it('Zen Master (cross-6) applies to all stats', () => {
    (
      ['strength', 'vitality', 'intelligence', 'charisma', 'dexterity', 'willpower'] as StatName[]
    ).forEach((stat) => expect(getSkillBonusForStat(stat, ['cross-6'])).toBe(3));
  });

  it('exposes typed daily lifecycle bonuses', () => {
    expect(getRestDayXpReward([])).toBe(10);
    expect(getRestDayXpReward(['vit-1'])).toBe(15);
    expect(getStreakRetentionRatio(['vit-2'])).toBe(0.5);
    expect(getWeeklyStreakFreezeAllowance(['wil-2'])).toBe(1);
    expect(getActiveDailyQuestCapacityBonus(['dex-2'])).toBe(2);
  });

  it('isSkillUnlockable matches the unlock list', () => {
    const ironGrip = getSkillById('str-1')!;
    expect(isSkillUnlockable(ironGrip, xp({ strength: totalXPForLevel(3) }))).toBe(true);
    expect(isSkillUnlockable(ironGrip, xp({ strength: totalXPForLevel(2) }))).toBe(false);
  });
});

describe('classEngine', () => {
  it('tiers up when hero level crosses a threshold', () => {
    const levelFive = totalXPForLevel(5);
    const evo = checkClassEvolution(
      xp({
        strength: levelFive,
        vitality: levelFive,
        intelligence: levelFive,
        charisma: levelFive,
        dexterity: levelFive,
        willpower: levelFive,
      }),
      1,
      'Apprentice Warrior',
      'strength',
    );
    expect(evo).toMatchObject({ newTier: 2, newClass: 'Warrior', dominantStat: 'strength' });
  });

  it('keeps the class at the same tier when another stat pulls ahead', () => {
    expect(checkClassEvolution(xp({ intelligence: 200 }), 1, 'Apprentice Warrior', 'strength')).toBeNull();
  });

  it('switches class on tier-up only after the new stat leads by a level', () => {
    const evo = checkClassEvolution(
      xp({
        strength: totalXPForLevel(5),
        vitality: totalXPForLevel(5),
        intelligence: totalXPForLevel(6),
        charisma: totalXPForLevel(5),
        dexterity: totalXPForLevel(5),
        willpower: totalXPForLevel(5),
      }),
      1,
      'Apprentice Warrior',
      'strength',
    );
    expect(evo).toMatchObject({ newTier: 2, newClass: 'Scholar', dominantStat: 'intelligence' });
  });

  it('respecs to a chosen stat without waiting for a tier', () => {
    expect(respecClassIdentity('intelligence', 1)).toEqual({
      dominantStat: 'intelligence',
      className: 'Apprentice Scholar',
    });
  });
});
