import { getClassContract } from '../classContracts';
import { Hero, Quest } from '../../types';

function buildHero(): Hero {
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
    heroLevel: 5,
    className: 'Warrior',
    classTier: 2,
    dominantStat: 'strength',
    totalQuestsCompleted: 0,
    currentStreak: 4,
    longestStreak: 4,
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
      skinTone: 2,
      hairStyle: 'short',
      hairColor: 1,
      eyeStyle: 'oval',
      mouthStyle: 'smile',
      glassesStyle: 'none',
    },
    lastRewardDate: '',
    totalLoginDays: 0,
  };
}

function buildQuest(overrides: Partial<Quest>): Quest {
  return {
    id: 'quest-1',
    title: '20 Push-ups',
    description: '',
    type: 'daily',
    difficulty: 'easy',
    stat: 'strength',
    xpReward: 15,
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

describe('classContracts', () => {
  it('returns a themed contract for the hero class and counts matching quests', () => {
    const contract = getClassContract(buildHero(), [
      buildQuest({ title: '20 Push-ups', isActive: true }),
      buildQuest({ id: 'quest-2', title: 'Run a 5K', type: 'side', isCompleted: true, isActive: false }),
    ]);

    expect(contract.title).toBe('Forge of Iron');
    expect(contract.activeMatches).toBe(1);
    expect(contract.completedMatches).toBe(1);
    expect(contract.recommended.map((quest) => quest.title)).toEqual(
      expect.arrayContaining(['20 Push-ups', 'Run a 5K', 'Couch to 5K']),
    );
  });
});
