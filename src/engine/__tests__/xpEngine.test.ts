import { xpForLevel, totalXPForLevel, levelFromXP, computeHeroLevel } from '../../config/xpTables';
import { calculateXPReward, applyXP, getRestDayXP } from '../xpEngine';

describe('xpTables (XP curve = baseXP * level^1.5)', () => {
  it.each([
    [1, 100],
    [2, 282],
    [3, 519],
    [5, 1118],
    [10, 3162],
    [50, 35355],
    [100, 100000],
  ])('xpForLevel(%i) = %i', (level, expected) => {
    expect(xpForLevel(level)).toBe(expected);
  });

  it.each([
    [0, 0],
    [50, 0],
    [99, 0],
    [100, 1],
    [382, 2],
    [1000, 3],
    [5000, 6],
  ])('levelFromXP(%i) = %i', (xp, level) => {
    expect(levelFromXP(xp)).toBe(level);
  });

  it.each([
    [1, 100],
    [2, 382],
    [3, 901],
  ])('totalXPForLevel(%i) = %i', (level, expected) => {
    expect(totalXPForLevel(level)).toBe(expected);
  });

  it('levelFromXP is monotonic and clamps to 100', () => {
    let prev = 0;
    for (let xp = 0; xp < 2_000_000; xp += 7919) {
      const lvl = levelFromXP(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      expect(lvl).toBeLessThanOrEqual(100);
      prev = lvl;
    }
  });

  it('computeHeroLevel is floored average of stat levels', () => {
    expect(computeHeroLevel({ a: 5, b: 4, c: 3, d: 3, e: 2, f: 1 })).toBe(3);
  });
});

describe('xpEngine', () => {
  it('calculateXPReward sums base + streak + skill bonus', () => {
    // medium=25, x1.2 -> floor(25*0.2)=4, +5% -> floor(25*0.05)=1, total=30
    expect(calculateXPReward('medium', 1.2, 5)).toEqual({
      baseXP: 25,
      streakBonus: 4,
      skillBonus: 1,
      totalXP: 30,
    });
  });

  it('calculateXPReward with no bonuses returns base', () => {
    expect(calculateXPReward('legendary', 1.0).totalXP).toBe(100);
  });

  it('applyXP detects level-up across the 100 XP boundary', () => {
    const r = applyXP(99, 1);
    expect(r).toEqual({ newXP: 100, oldLevel: 0, newLevel: 1, didLevelUp: true });
  });

  it('applyXP does not level up within a level', () => {
    expect(applyXP(100, 10).didLevelUp).toBe(false);
  });

  it('getRestDayXP is 15 with Second Wind, else 10', () => {
    expect(getRestDayXP(true)).toBe(15);
    expect(getRestDayXP(false)).toBe(10);
  });
});
