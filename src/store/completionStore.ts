import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, StatName, QuestType } from '../types';

export interface CompletionEvent {
  id: string;
  questId: string;
  title: string;
  stat: StatName;
  type: QuestType;
  completedAt: string;
  xpAwarded: number;
}

/** Immutable facts: resetting or deleting a quest never removes its earned credit. */
interface CompletionState {
  hydrated: boolean;
  heroId: string | null;
  events: CompletionEvent[];
  ensureHero: (heroId: string) => void;
  recordCompletion: (quest: Quest, xpAwarded: number) => void;
  seedLegacy: (quests: Quest[]) => void;
  mergeEvents: (events: CompletionEvent[]) => void;
  clear: () => void;
}

export function completionFromQuest(quest: Quest, xpAwarded: number): CompletionEvent | null {
  if (!quest.isCompleted || !quest.completedAt || !Number.isFinite(Date.parse(quest.completedAt))) return null;
  return { id: `${quest.id}:${quest.completedAt}`, questId: quest.id, title: quest.title,
    stat: quest.stat, type: quest.type, completedAt: quest.completedAt, xpAwarded };
}

export const useCompletionStore = create<CompletionState>()(persist((set, get) => ({
  hydrated: false,
  heroId: null,
  events: [],
  ensureHero: (heroId) => {
    if (get().heroId !== heroId) set({ heroId, events: [] });
  },
  mergeEvents: (events) => set((state) => {
    const facts = new Map(state.events.map((event) => [event.id, event]));
    for (const event of events) if (!facts.has(event.id)) facts.set(event.id, event);
    return { events: [...facts.values()] };
  }),
  recordCompletion: (quest, xpAwarded) => {
    const event = completionFromQuest(quest, xpAwarded);
    if (event) get().mergeEvents([event]);
  },
  // Only import known dates; never reconstruct unknown past completions from counters.
  seedLegacy: (quests) => get().mergeEvents(quests.map((quest) => completionFromQuest(quest, 0))
    .filter((event): event is CompletionEvent => event !== null)),
  clear: () => set({ heroId: null, events: [] }),
}), { name: 'life-rpg-completions-v1', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ heroId: s.heroId, events: s.events }), onRehydrateStorage: () => () => { useCompletionStore.setState({ hydrated: true }); } }));
