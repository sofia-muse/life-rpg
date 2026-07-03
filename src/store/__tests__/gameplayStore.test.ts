import { useGameplayStore } from '../gameplayStore';
import { useHeroStore } from '../heroStore';
import { useJournalStore } from '../journalStore';
import { useQuestStore } from '../questStore';
import { useSkillStore } from '../skillStore';
import { getStatBlock } from '../../engine/statEngine';
import { Quest, StatName } from '../../types';

const emptyXp = (): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
});

function buildQuest(overrides: Partial<Quest>): Quest {
  return {
    id: 'quest-1',
    title: 'Quest',
    description: '',
    type: 'side',
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

beforeEach(() => {
  const statXP = emptyXp();
  useHeroStore.setState({
    hero: {
      id: 'hero-1',
      name: 'Aria',
      avatarSeed: 'aria',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      stats: getStatBlock(statXP),
      statXP,
      heroLevel: 1,
      className: 'Apprentice Warrior',
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
      totalLoginDays: 0,
    },
    isOnboarded: true,
    _hasHydrated: true,
  });
  useQuestStore.setState({ quests: [] });
  useSkillStore.setState({ unlockedSkills: [] });
  useJournalStore.setState({ entries: [] });
});

describe('gameplayStore local quest flow', () => {
  it('unlocks skills on the same completion that crosses the threshold', async () => {
    const strengthXp = { ...emptyXp(), strength: 890 };
    useHeroStore.setState((state) => ({
      hero: state.hero
        ? {
            ...state.hero,
            statXP: strengthXp,
            stats: getStatBlock(strengthXp),
          }
        : null,
    }));
    useQuestStore.setState({
      quests: [buildQuest({ id: 'quest-skill', stat: 'strength', difficulty: 'easy' })],
    });

    const result = await useGameplayStore.getState().completeQuest('quest-skill');

    expect(result?.newSkills.map((skill) => skill.id)).toContain('str-1');
    expect(useSkillStore.getState().unlockedSkills.map((skill) => skill.skillId)).toContain('str-1');
  });

  it('merges same-day journal entries across multiple quest completions', async () => {
    useQuestStore.setState({
      quests: [
        buildQuest({ id: 'quest-a', stat: 'strength', difficulty: 'easy' }),
        buildQuest({ id: 'quest-b', stat: 'vitality', difficulty: 'medium' }),
      ],
    });

    await useGameplayStore.getState().completeQuest('quest-a');
    await useGameplayStore.getState().completeQuest('quest-b');

    const entry = useJournalStore.getState().entries[0];
    expect(useJournalStore.getState().entries).toHaveLength(1);
    expect(entry.questsCompleted).toEqual(expect.arrayContaining(['quest-a', 'quest-b']));
    expect(entry.xpGained.strength).toBe(15);
    expect(entry.xpGained.vitality).toBe(25);
  });

  it('requires boss quests to complete all steps before awarding XP', async () => {
    useQuestStore.setState({
      quests: [
        buildQuest({
          id: 'boss-1',
          type: 'boss',
          difficulty: 'hard',
          totalSteps: 2,
          completedSteps: 0,
        }),
      ],
    });

    const first = await useGameplayStore.getState().completeQuest('boss-1');
    const second = await useGameplayStore.getState().completeQuest('boss-1');

    expect(first).toMatchObject({ completed: false, stepAdvancedOnly: true, xpAwarded: 0 });
    expect(useQuestStore.getState().getQuestById('boss-1')?.completedSteps).toBe(2);
    expect(second).toMatchObject({ completed: true, stepAdvancedOnly: false });
    expect(second?.xpAwarded).toBeGreaterThan(0);
  });

  it('resets expired daily quests during the daily lifecycle pass', () => {
    useHeroStore.setState((state) => ({
      hero: state.hero
        ? {
            ...state.hero,
            lastActiveDate: '2025-12-31',
          }
        : null,
    }));
    useQuestStore.setState({
      quests: [
        buildQuest({
          id: 'daily-old',
          type: 'daily',
          isCompleted: true,
          completedAt: '2025-12-31T08:00:00.000Z',
        }),
      ],
    });

    const lifecycle = useGameplayStore.getState().runDailyLifecycle();
    const quest = useQuestStore.getState().getQuestById('daily-old');

    expect(lifecycle.rewardAvailable).toBe(true);
    expect(quest?.isCompleted).toBe(false);
    expect(quest?.completedAt).toBeUndefined();
  });
});
