import { useCompletionStore, CompletionEvent } from '../completionStore';
import { useLibraryStore, libraryProgress, LIBRARY_TITLE_ID } from '../libraryStore';
import { useHeroStore } from '../heroStore';
import { useQuestStore } from '../questStore';
import { useGameplayStore } from '../gameplayStore';
import { useSettingsStore } from '../settingsStore';
import { getPrimaryContract } from '../../config/classContracts';
import { getCurrentWeekKey } from '../../config/weeklyPaths';
import { Quest } from '../../types';

const quest = (completedAt: string): Quest => ({ id: 'reading', title: 'Read a book', description: '', type: 'daily',
  stat: 'intelligence', difficulty: 'easy', xpReward: 15, isActive: true, isCompleted: true, completedAt,
  createdAt: completedAt, updatedAt: completedAt, streak: 1, bestStreak: 1, daysCompleted: 1 });
const fact = (day: number): CompletionEvent => ({ id: `reading:2026-10-${day}T12:00:00.000Z`, questId: 'reading', title: 'Read a book',
  stat: 'intelligence', type: 'daily', completedAt: `2026-10-${day}T12:00:00.000Z`, xpAwarded: 15 });

beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date('2026-10-26T10:00:00.000Z'));
  useCompletionStore.getState().clear(); useLibraryStore.getState().clear();
  useHeroStore.getState().createHero('Reader', 'reader', ['intelligence']);
  useQuestStore.setState({ quests: [] });
});
afterEach(() => jest.useRealTimers());

it('awards rest XP once per UTC day, including after a saved hero is restored', () => {
  const before = useHeroStore.getState().hero!.statXP.vitality;
  expect(useHeroStore.getState().takeRestDay([])).toBe(true);
  const saved = JSON.parse(JSON.stringify(useHeroStore.getState().hero));
  useHeroStore.getState().setHero(saved);
  expect(useHeroStore.getState().takeRestDay([])).toBe(false);
  expect(useHeroStore.getState().hero!.statXP.vitality).toBe(before + 10);
  jest.setSystemTime(new Date('2026-10-27T10:00:00.000Z'));
  expect(useHeroStore.getState().takeRestDay([])).toBe(true);
  expect(useHeroStore.getState().hero!.restDaysUsed).toBe(2);
});

it('keeps earned weekly credit after daily reset and deletion, and counts repeated days', () => {
  const hero = useHeroStore.getState().hero!;
  const history = useCompletionStore.getState(); history.ensureHero(hero.id);
  const monday = quest('2026-10-26T12:00:00.000Z');
  history.recordCompletion(monday, 15); history.recordCompletion(monday, 15);
  history.recordCompletion(quest('2026-10-27T12:00:00.000Z'), 15);
  useQuestStore.setState({ quests: [monday] });
  jest.setSystemTime(new Date('2026-10-28T10:00:00.000Z'));
  useGameplayStore.getState().runDailyLifecycle();
  useQuestStore.getState().deleteQuest('reading');
  const contract = getPrimaryContract(hero, { weeklyPath: 'focus', weeklyPathWeekKey: getCurrentWeekKey(), weeklyPathStartedAt: null, weeklyRewardWeekKey: null, weeklyRewardTitle: null, weeklyRewardBadge: null }, [], 0, useCompletionStore.getState().events);
  expect(contract.completedMatches).toBe(2);
  expect(useCompletionStore.getState().events).toHaveLength(2);
});

it('does not invent legacy completion dates or leak events to another hero', () => {
  useCompletionStore.getState().ensureHero('first');
  useCompletionStore.getState().seedLegacy([quest('2026-10-26T12:00:00.000Z'), { ...quest(''), daysCompleted: 100 }]);
  expect(useCompletionStore.getState().events).toHaveLength(1);
  useCompletionStore.getState().ensureHero('second');
  expect(useCompletionStore.getState().events).toEqual([]);
});

it('restores the library across nonconsecutive days and grants only one title', () => {
  expect(useLibraryStore.getState().start({ heroId: 'hero', questId: 'reading', habit: 'Read', minutes: 15 })).toBe(true);
  const run = useLibraryStore.getState().run!;
  const facts = [26, 27, 29, 30, 31].map(fact);
  expect(libraryProgress(run, [facts[0]!, facts[0]!, { ...fact(28), questId: 'other' }])).toBe(1);
  expect(useLibraryStore.getState().claim('hero', facts.slice(0, 4))).toBe(false);
  expect(useLibraryStore.getState().claim('another-hero', facts)).toBe(false);
  expect(useLibraryStore.getState().claim('hero', facts)).toBe(true);
  expect(useLibraryStore.getState().claim('hero', facts)).toBe(false);
  expect(useSettingsStore.getState().unlockedTitleIds.filter((id) => id === LIBRARY_TITLE_ID)).toHaveLength(1);
});

it('rejects invalid goals and cannot restart a chapter to farm its reward', () => {
  expect(useLibraryStore.getState().start({ heroId: 'hero', questId: 'reading', habit: '', minutes: 15 })).toBe(false);
  expect(useLibraryStore.getState().start({ heroId: 'hero', questId: 'reading', habit: 'Read', minutes: 0 })).toBe(false);
  expect(useLibraryStore.getState().start({ heroId: 'hero', questId: 'reading', habit: 'Read', minutes: 15 })).toBe(true);
  expect(useLibraryStore.getState().start({ heroId: 'hero', questId: 'second', habit: 'Read', minutes: 15 })).toBe(false);
});

it('opening the app alone does not advance the habit streak', () => {
  const hero = useHeroStore.getState().hero!;
  useHeroStore.getState().setHero({ ...hero, currentStreak: 2, lastActiveDate: '2026-10-25' });
  useGameplayStore.getState().runDailyLifecycle();
  expect(useHeroStore.getState().hero!.currentStreak).toBe(2);
});

it('starts a new hero streak only after the first completed quest', async () => {
  const hero = useHeroStore.getState().hero!;
  expect(hero.currentStreak).toBe(0);
  useQuestStore.setState({ quests: [{ ...quest('2026-10-26T12:00:00.000Z'), isCompleted: false, completedAt: undefined }] });
  await useGameplayStore.getState().completeQuest('reading');
  expect(useHeroStore.getState().hero!.currentStreak).toBe(1);
});
