import { xpForLevel, totalXPForLevel, levelFromXP, computeHeroLevel } from '../../config/xpTables';
import { calculateXPReward, applyXP, getRestDayXP } from '../xpEngine';

describe('xpTables (XP curve = floor(14 * level^0.8))', () => {
  it.each([
    [1, 14],
    [2, 24],
    [3, 33],
    [5, 50],
    [10, 88],
    [50, 320],
    [100, 557],
  ])('xpForLevel(%i) = %i', (level, expected) => {
    expect(xpForLevel(level)).toBe(expected);
  });

  it.each([
    [0, 0],
    [13, 0],
    [14, 1],
    [37, 1],
    [38, 2],
    [70, 2],
    [71, 3],
  ])('levelFromXP(%i) = %i', (xp, level) => {
    expect(levelFromXP(xp)).toBe(level);
  });

  it.each([
    [1, 14],
    [2, 38],
    [3, 71],
    [5, 163],
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

  it('computeHeroLevel weights the highest stat and the mean of the rest', () => {
    expect(computeHeroLevel({ a: 5, b: 4, c: 3, d: 3, e: 2, f: 1 })).toBe(4);
    expect(computeHeroLevel({ str: 20, vit: 4, int: 4, cha: 4, dex: 4, wil: 4 })).toBe(13);
    expect(computeHeroLevel({ a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 })).toBe(1);
  });
});

describe('xpEngine', () => {
  it('calculateXPReward sums base + hero streak + quest streak + skill bonus', () => {
    // medium=25, hero x1.2 -> 5, quest x1.5 -> 12, +5% -> 1, total=43
    expect(calculateXPReward('medium', 1.2, 5, 1.5)).toEqual({
      baseXP: 25,
      streakBonus: 17,
      heroStreakBonus: 5,
      questStreakBonus: 12,
      skillBonus: 1,
      totalXP: 43,
    });
  });

  it('calculateXPReward with no bonuses returns base', () => {
    expect(calculateXPReward('legendary', 1.0).totalXP).toBe(100);
  });

  it('applyXP detects level-up across the first level boundary', () => {
    const r = applyXP(13, 1);
    expect(r).toEqual({ newXP: 14, oldLevel: 0, newLevel: 1, didLevelUp: true });
  });

  it('applyXP does not level up within a level', () => {
    expect(applyXP(100, 10).didLevelUp).toBe(false);
  });

  it('getRestDayXP scales the skill base with vitality level', () => {
    expect(getRestDayXP(true)).toBe(15);
    expect(getRestDayXP(false)).toBe(10);
    expect(getRestDayXP(true, 4)).toBe(19);
    expect(getRestDayXP(false, 4)).toBe(14);
  });
});
