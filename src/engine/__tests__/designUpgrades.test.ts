import {
  isDifficultyAllowed,
  getBossStepXpBonus,
  getWeeklyCapacityBonus,
  getNewlyUnlockedSkills,
  getQuestSkillBonus,
} from '../skillEngine';
import { resolveEvolutionPathId, applyQuestEvolution, getQuestEvolutionState } from '../questProgression';
import { buildTomorrowVow } from '../journalEngine';
import { DEMO_FORGED_SKILLS, getDemoForgedSkills } from '../../config/demoForgedSkills';
import { grantSagaOrChapterRewards } from '../../config/progressionRewards';
import { SKILLS } from '../../config/skills';
import { Quest, StatName } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useJournalStore } from '../../store/journalStore';
import { registerForgedSkills } from '../../config/skills';

jest.mock('../../config/env', () => ({
  env: { apiUrl: 'http://localhost:5005', demoMode: true },
}));

const xp = (over: Partial<Record<StatName, number>> = {}): Record<StatName, number> => ({
  strength: 0,
  vitality: 0,
  intelligence: 0,
  charisma: 0,
  dexterity: 0,
  willpower: 0,
  ...over,
});

function buildQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'q1',
    title: 'Custom Push Routine',
    description: 'A renamed daily',
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

describe('difficulty skill gates', () => {
  it('allows easy/medium without unlocks', () => {
    expect(isDifficultyAllowed('easy', 'strength', [])).toBe(true);
    expect(isDifficultyAllowed('medium', 'strength', [])).toBe(true);
  });

  it('blocks hard strength until Titan\'s Resolve (str-2)', () => {
    expect(isDifficultyAllowed('hard', 'strength', [])).toBe(false);
    expect(isDifficultyAllowed('hard', 'strength', ['str-2'])).toBe(true);
  });

  it('blocks legendary strength until Colossus (str-3); legendary implies hard', () => {
    expect(isDifficultyAllowed('legendary', 'strength', ['str-2'])).toBe(false);
    expect(isDifficultyAllowed('legendary', 'strength', ['str-3'])).toBe(true);
    expect(isDifficultyAllowed('hard', 'strength', ['str-3'])).toBe(true);
  });

  it('gates other stats independently', () => {
    expect(isDifficultyAllowed('hard', 'vitality', ['str-2'])).toBe(false);
    expect(isDifficultyAllowed('hard', 'vitality', ['vit-2'])).toBe(true);
  });
});

describe('post-L15 skill unlocks', () => {
  it('unlocks Mountain Breaker (str-4) at strength L25', () => {
    // Level 25 requires substantial XP — use a high value that crosses L25
    // xpForLevel = floor(100 * level^1.5); cumulative around L25 is large
    const highXp = xp({ strength: 150_000 });
    const unlocked = getNewlyUnlockedSkills(highXp, [
      'str-1',
      'str-2',
      'str-3',
    ]);
    const ids = unlocked.map((s) => s.id);
    expect(ids).toContain('str-4');
  });

  it('catalog includes L25 and L40 skills with new effect types', () => {
    const str4 = SKILLS.find((s) => s.id === 'str-4');
    const str5 = SKILLS.find((s) => s.id === 'str-5');
    expect(str4?.requiredLevel).toBe(25);
    expect(str5?.requiredLevel).toBe(40);
    expect(str4?.effects.some((e) => e.type === 'bossStepXp')).toBe(true);
    expect(str5?.effects.some((e) => e.type === 'weeklyCapacity')).toBe(true);
  });

  it('resolves bossStepXp and weeklyCapacity bonuses', () => {
    expect(getBossStepXpBonus(['str-4'])).toBe(10);
    expect(getWeeklyCapacityBonus(['str-5', 'vit-5'])).toBe(2);
    expect(getBossStepXpBonus([])).toBe(0);
  });
});

describe('quest evolution by path id', () => {
  it('resolveEvolutionPathId maps stage titles to stable path ids', () => {
    expect(resolveEvolutionPathId('20 Push-ups')).toBe('pushups');
    expect(resolveEvolutionPathId('50 Push-ups')).toBe('pushups');
    expect(resolveEvolutionPathId('Read for 30 Minutes')).toBe('reading');
    expect(resolveEvolutionPathId('Unknown Quest')).toBeUndefined();
  });

  it('evolves custom-titled dailies when evolutionPathId is set', () => {
    const quest = buildQuest({
      title: 'My Morning Push Set',
      evolutionPathId: 'pushups',
      daysCompleted: 3,
    });
    const evolved = applyQuestEvolution(quest);
    expect(evolved.title).toBe('30 Push-ups');
    expect(evolved.evolutionPathId).toBe('pushups');
    expect(evolved.difficulty).toBe('medium');
  });

  it('tracks evolution state from path id without matching title', () => {
    const state = getQuestEvolutionState(
      buildQuest({
        title: 'Renamed Habit',
        evolutionPathId: 'pushups',
        daysCompleted: 4,
      }),
    );
    expect(state?.rankName).toBe('Adept');
    expect(state?.nextTitle).toBe('50 Push-ups');
    expect(state?.nextUnlockAt).toBe(7);
  });
});

describe('journal tomorrow vow', () => {
  it('builds a vow with mentor line and recommended template', () => {
    const vow = buildTomorrowVow('strength', ['20 Push-ups']);
    expect(vow).not.toBeNull();
    expect(vow!.templateTitle).toBe('20 Push-ups');
    expect(vow!.stat).toBe('strength');
    expect(vow!.vowText).toContain("Tomorrow's vow");
    expect(vow!.mentorName).toBeTruthy();
  });

  it('falls back to a daily template when recommendations miss', () => {
    const vow = buildTomorrowVow('intelligence', ['Not A Real Title']);
    expect(vow).not.toBeNull();
    expect(vow!.stat).toBe('intelligence');
  });
});

describe('demo forged skills', () => {
  it('exposes canned forged skills in demo mode', () => {
    expect(getDemoForgedSkills()).toHaveLength(2);
    expect(DEMO_FORGED_SKILLS[0].id).toBe('demo-forge-ember');
  });

  it('registers demo forge bonuses into skill resolution', () => {
    registerForgedSkills(DEMO_FORGED_SKILLS);
    expect(getQuestSkillBonus({ stat: 'strength', type: 'daily' }, [])).toBe(5);
    expect(getQuestSkillBonus({ stat: 'intelligence', type: 'daily' }, [])).toBe(5);
    registerForgedSkills([]);
  });
});

describe('chapter/saga reward grants', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      unlockedTitleIds: ['adventurer'],
      customTitleLabels: {},
      equippedTitleId: 'adventurer',
    });
    useJournalStore.setState({ entries: [] });
  });

  it('grants campaign chapter reward title on boss clear', () => {
    grantSagaOrChapterRewards(
      buildQuest({
        type: 'boss',
        title: '30-Day Fitness Challenge',
        isCompleted: true,
        totalSteps: 30,
        completedSteps: 30,
        campaignChapterId: 'iron_awakening',
      }),
    );

    const settings = useSettingsStore.getState();
    expect(settings.unlockedTitleIds.some((id) => id.includes('Iron Awakened') || id.startsWith('custom:'))).toBe(
      true,
    );
    expect(useJournalStore.getState().entries.length).toBeGreaterThan(0);
  });

  it('ignores incomplete or non-boss quests', () => {
    grantSagaOrChapterRewards(buildQuest({ type: 'daily', isCompleted: true }));
    expect(useSettingsStore.getState().unlockedTitleIds).toEqual(['adventurer']);
  });
});
