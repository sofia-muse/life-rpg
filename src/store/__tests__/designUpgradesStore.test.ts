import { detectNewAchievements } from '../../config/achievementTracker';
import { useHeroStore } from '../heroStore';
import { useQuestStore } from '../questStore';
import { useSettingsStore } from '../settingsStore';
import { useSkillStore } from '../skillStore';
import { useForgedSkillStore } from '../forgedSkillStore';
import { useRaidStore, emptyRaidPersonal } from '../raidStore';
import { getStatBlock } from '../../engine/statEngine';
import { StatName } from '../../types';
import { getWeeklyPathContract, getPrimaryContract } from '../../config/classContracts';
import { getCurrentWeekKey } from '../../config/weeklyPaths';

jest.mock('../../config/env', () => ({
  env: { apiUrl: 'http://localhost:5005', demoMode: false },
}));

const emptyXp = (): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
});

function seedHero(overrides: { totalQuestsCompleted?: number; restDaysUsed?: number } = {}) {
  const statXP = emptyXp();
  useHeroStore.setState({
    hero: {
      id: 'hero-1',
      name: 'Aria',
      avatarSeed: 'aria',
      createdAt: '2026-01-01T00:00:00.000Z',
      stats: getStatBlock(statXP),
      statXP,
      heroLevel: 1,
      className: 'Apprentice Warrior',
      classTier: 1,
      dominantStat: 'strength',
      totalQuestsCompleted: overrides.totalQuestsCompleted ?? 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '2026-01-01',
      restDaysUsed: overrides.restDaysUsed ?? 0,
      appearance: {
        crestShape: 'shield',
        sigil: 'sword',
        accentOverride: 'none',
        titleDisplay: true,
        unlockedCrestShapes: ['shield', 'circle'],
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
      totalLoginDays: 1,
    },
    isOnboarded: true,
    _hasHydrated: true,
  });
}

describe('achievement celebration tracker', () => {
  beforeEach(() => {
    seedHero({ totalQuestsCompleted: 1 });
    useQuestStore.setState({ quests: [] });
    useSkillStore.setState({ unlockedSkills: [] });
    useForgedSkillStore.setState({ forged: [], loading: false, error: null });
    useRaidStore.setState({ personal: emptyRaidPersonal() });
    useSettingsStore.setState({
      seenAchievementIds: [],
      unlockedTitleIds: ['adventurer'],
      customTitleLabels: {},
      weeklyContractsCompleted: 0,
      weeklyRewardTitle: null,
    });
  });

  it('returns newly earned achievements and marks them seen', () => {
    const first = detectNewAchievements();
    expect(first.some((a) => a.id === 'first_quest')).toBe(true);

    const second = detectNewAchievements();
    expect(second.some((a) => a.id === 'first_quest')).toBe(false);
    expect(useSettingsStore.getState().seenAchievementIds).toContain('first_quest');
  });
});

describe('settings title unlocks and weekly claim', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      unlockedTitleIds: ['adventurer'],
      customTitleLabels: {},
      equippedTitleId: 'adventurer',
      weeklyPath: 'power',
      weeklyPathWeekKey: getCurrentWeekKey(),
      weeklyPathStartedAt: new Date().toISOString(),
      weeklyRewardWeekKey: null,
      weeklyRewardTitle: null,
      weeklyRewardBadge: null,
      weeklyContractsCompleted: 0,
    });
  });

  it('unlockTitle adds custom campaign relics', () => {
    useSettingsStore.getState().unlockTitle('custom:Iron Awakened', 'Iron Awakened');
    const state = useSettingsStore.getState();
    expect(state.unlockedTitleIds).toContain('custom:Iron Awakened');
    expect(state.customTitleLabels['custom:Iron Awakened']).toBe('Iron Awakened');
  });

  it('claimWeeklyReward auto-equips the path title', () => {
    useSettingsStore.getState().claimWeeklyReward({
      title: 'Vanguard of Power',
      badge: 'Power Cup',
    });
    const state = useSettingsStore.getState();
    expect(state.equippedTitleId).toBe('vanguard_power');
    expect(state.unlockedTitleIds).toContain('vanguard_power');
    expect(state.weeklyRewardTitle).toBe('Vanguard of Power');
  });
});

describe('weekly path capacity bonus', () => {
  beforeEach(() => {
    seedHero();
  });

  it('increases requiredCount when weeklyCapacity bonus is applied', () => {
    const activeHero = useHeroStore.getState().hero!;
    const settings = {
      weeklyPath: 'power' as const,
      weeklyPathWeekKey: getCurrentWeekKey(),
      weeklyPathStartedAt: new Date().toISOString(),
      weeklyRewardWeekKey: null,
      weeklyRewardTitle: null,
      weeklyRewardBadge: null,
    };

    const base = getWeeklyPathContract(activeHero, settings, [], 0);
    const boosted = getWeeklyPathContract(activeHero, settings, [], 2);
    expect(base?.requiredCount).toBe(4);
    expect(boosted?.requiredCount).toBe(6);

    const primary = getPrimaryContract(activeHero, settings, [], 1);
    expect(primary.kind).toBe('weeklyPath');
    expect(primary.requiredCount).toBe(5);
  });

  it('falls back to class contract when no weekly path is active', () => {
    const activeHero = useHeroStore.getState().hero!;
    const settings = {
      weeklyPath: null,
      weeklyPathWeekKey: null,
      weeklyPathStartedAt: null,
      weeklyRewardWeekKey: null,
      weeklyRewardTitle: null,
      weeklyRewardBadge: null,
    };
    const contract = getPrimaryContract(activeHero, settings, [], 0);
    expect(contract.kind).toBe('class');
  });
});

describe('hero rest day', () => {
  beforeEach(() => {
    seedHero({ restDaysUsed: 0 });
  });

  it('awards vitality XP via takeRestDay', () => {
    const before = useHeroStore.getState().hero!.statXP.vitality;
    const rests = useHeroStore.getState().hero!.restDaysUsed;
    useHeroStore.getState().takeRestDay(['vit-1']);
    const hero = useHeroStore.getState().hero!;
    expect(hero.statXP.vitality).toBeGreaterThan(before);
    expect(hero.restDaysUsed).toBe(rests + 1);
  });
});
