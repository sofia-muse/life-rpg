import { Quest, StatName } from '../../types';
import {
  generateQuestNarrative,
  generateDailySummary,
  generateMilestoneNarrative,
} from '../journalEngine';
import { getStatBlock, getTotalStatLevels } from '../statEngine';
import { getStatDisplayProgress } from '../xpEngine';
import { getCurrentMilestone, daysUntilNextMilestone, isNewDay } from '../streakEngine';
import { getSkillProgress } from '../skillEngine';
import { getEvolutionNarrative } from '../classEngine';
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

const quest = (over: Partial<Quest> = {}): Quest => ({
  id: 'q1',
  title: 'Deadlift PR',
  description: '',
  type: 'side',
  difficulty: 'hard',
  stat: 'strength',
  xpReward: 50,
  isCompleted: true,
  isActive: true,
  createdAt: '2026-06-01',
  streak: 1,
  bestStreak: 1,
  daysCompleted: 1,
  ...over,
});

describe('journalEngine', () => {
  it('generateQuestNarrative injects the quest title', () => {
    expect(generateQuestNarrative(quest({ title: 'Run 5k' }))).toContain('Run 5k');
  });

  it('daily summary handles a rest day', () => {
    const s = generateDailySummary([], xp(), [], [], 0);
    expect(s).toContain('quiet day');
  });

  it('daily summary aggregates quests, xp, level-ups, skills and streak', () => {
    const s = generateDailySummary(
      [quest(), quest({ stat: 'intelligence', title: 'Read' }), quest({ title: 'Run' })],
      xp({ strength: 50, intelligence: 25 }),
      ['strength'],
      ['str-1', 'str-2'],
      7,
    );
    expect(s).toContain('mighty day'); // 3+ quests
    expect(s).toContain('75 XP');
    expect(s).toContain('leveled up');
    expect(s).toContain('2 new skills');
    expect(s).toContain('7 days');
  });

  it('milestone narrative formats the name', () => {
    expect(generateMilestoneNarrative('One Week Strong')).toContain('One Week Strong');
  });
});

describe('engine helpers', () => {
  it('getStatBlock returns per-stat levels', () => {
    expect(getStatBlock(xp({ strength: 100 })).strength).toBe(1);
  });

  it('getTotalStatLevels sums levels', () => {
    expect(getTotalStatLevels(xp({ strength: 100, vitality: 100 }))).toBe(2);
  });

  it('getStatDisplayProgress reports level and a 0..1 progress', () => {
    const p = getStatDisplayProgress(150);
    expect(p.level).toBe(1);
    expect(p.progress).toBeGreaterThanOrEqual(0);
    expect(p.progress).toBeLessThanOrEqual(1);
  });

  it('getCurrentMilestone / daysUntilNextMilestone', () => {
    expect(getCurrentMilestone(8)?.days).toBe(7);
    expect(getCurrentMilestone(0)).toBeNull();
    expect(daysUntilNextMilestone(0)).toBe(3);
    expect(daysUntilNextMilestone(400)).toBeNull();
  });

  it('isNewDay compares dates', () => {
    expect(isNewDay('2026-06-03', '2026-06-04')).toBe(true);
    expect(isNewDay('2026-06-04', '2026-06-04')).toBe(false);
  });

  it('getSkillProgress is 0..1 toward the requirement', () => {
    const ironGrip = getSkillById('str-1')!; // requires strength level 3
    expect(getSkillProgress(ironGrip, xp({ strength: 0 }))).toBe(0);
    expect(getSkillProgress(ironGrip, xp({ strength: 100_000 }))).toBe(1);
  });

  it('getEvolutionNarrative renders tier-up vs shift text', () => {
    const tierUp = getEvolutionNarrative({
      oldClass: 'Warrior',
      newClass: 'Champion of Iron',
      oldTier: 2,
      newTier: 3,
      dominantStat: 'strength',
      description: 'd',
    });
    expect(tierUp).toContain('evolved into');
  });
});
