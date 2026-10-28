import { filterQuests } from '../questFilters';
import { getQuestDisplayTitle } from '../../config/questFlavor';
import { Quest } from '../../types';

const base: Quest = {
  id: 'ready',
  title: 'Read a book',
  description: 'Ten pages before bed',
  type: 'daily',
  difficulty: 'easy',
  stat: 'intelligence',
  xpReward: 15,
  isCompleted: false,
  isActive: true,
  createdAt: '2026-10-28',
  streak: 0,
  bestStreak: 0,
  daysCompleted: 0,
};
const quests: Quest[] = [
  base,
  { ...base, id: 'done', title: 'Walk', stat: 'vitality', isCompleted: true },
  { ...base, id: 'paused', title: 'Stretch', stat: 'vitality', isActive: false },
];

describe('quest filters', () => {
  it('combines search, stat and status without modifying the source', () => {
    expect(filterQuests(quests, '  PAGES  ', 'intelligence', 'ready')).toEqual([base]);
    expect(filterQuests(quests, 'Read', 'vitality', 'all')).toEqual([]);
    expect(quests.map((quest) => quest.id)).toEqual(['ready', 'done', 'paused']);
  });
  it('keeps completed quests out of ready and paused results', () => {
    expect(filterQuests(quests, '', 'all', 'ready').map((q) => q.id)).toEqual(['ready']);
    expect(filterQuests(quests, '', 'all', 'completed').map((q) => q.id)).toEqual(['done']);
    expect(filterQuests(quests, '', 'all', 'paused').map((q) => q.id)).toEqual(['paused']);
    expect(
      filterQuests([{ ...base, isCompleted: true, isActive: false }], '', 'all', 'paused'),
    ).toEqual([]);
  });
  it('finds the displayed fantasy title as well as the original title', () => {
    expect(filterQuests(quests, getQuestDisplayTitle(base, true), 'all', 'all', true)).toEqual([
      base,
    ]);
    expect(filterQuests(quests, 'Read a book', 'all', 'all', true)).toEqual([base]);
  });
  it('returns all quests after filters are cleared, and handles an empty collection', () => {
    expect(filterQuests(quests, ' ', 'all', 'all')).toEqual(quests);
    expect(filterQuests([], '', 'all', 'all')).toEqual([]);
  });
});
