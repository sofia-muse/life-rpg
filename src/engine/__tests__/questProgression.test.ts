import { applyQuestEvolution, getBossSagaState, getQuestEvolutionState } from '../questProgression';
import { Quest } from '../../types';

function buildQuest(overrides: Partial<Quest>): Quest {
  return {
    id: 'quest-1',
    title: '20 Push-ups',
    description: 'Complete 20 push-ups to build upper body strength.',
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

describe('questProgression', () => {
  it('upgrades supported daily quests when they hit the next completion threshold', () => {
    const evolved = applyQuestEvolution(buildQuest({ daysCompleted: 3 }));

    expect(evolved.title).toBe('30 Push-ups');
    expect(evolved.difficulty).toBe('medium');
    expect(evolved.xpReward).toBe(25);
  });

  it('reports the next evolution stage for supported daily quests', () => {
    const evolution = getQuestEvolutionState(buildQuest({ title: '30 Push-ups', daysCompleted: 4 }));

    expect(evolution).toMatchObject({
      rankName: 'Adept',
      nextRankName: 'Veteran',
      nextTitle: '50 Push-ups',
      nextUnlockAt: 7,
    });
  });

  it('builds saga state for boss quests', () => {
    const saga = getBossSagaState(
      buildQuest({
        title: 'Couch to 5K',
        type: 'boss',
        difficulty: 'legendary',
        totalSteps: 8,
        completedSteps: 4,
      }),
    );

    expect(saga).toMatchObject({
      sagaTitle: 'The Five-Kilometer Rite',
      rewardTitle: "Trailblazer's Crest",
      currentPhase: 'Break the Wall',
    });
  });
});
