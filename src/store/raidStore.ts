import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { StatName } from '../types';
import { CreateRaidRequest, RaidDto, raidApi } from '../api/raidApi';
import { useJournalStore } from './journalStore';

export interface RaidPersonalStats {
  raidsCleared: number;
  totalContribution: number;
  /** Best single-raid share of the party goal (0–1). */
  bestContributionShare: number;
  clearedRaidIds: string[];
  lastRewardTitle: string | null;
}

interface RaidState {
  raids: RaidDto[];
  selectedRaidId: string | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  personal: RaidPersonalStats;
  load: () => Promise<void>;
  selectRaid: (id: string | null) => void;
  createRaid: (req: CreateRaidRequest) => Promise<RaidDto | null>;
  joinRaid: (inviteCode: string) => Promise<RaidDto | null>;
  contribute: (raidId: string, amount: number, note?: string) => Promise<RaidDto | null>;
  refreshRaid: (raidId: string) => Promise<void>;
  clear: () => void;
}

export const emptyRaidPersonal = (): RaidPersonalStats => ({
  raidsCleared: 0,
  totalContribution: 0,
  bestContributionShare: 0,
  clearedRaidIds: [],
  lastRewardTitle: null,
});

function upsertRaid(list: RaidDto[], raid: RaidDto): RaidDto[] {
  const idx = list.findIndex((r) => r.id === raid.id);
  if (idx === -1) return [raid, ...list];
  const next = [...list];
  next[idx] = raid;
  return next;
}

/** Recompute durable personal tallies from the raids the hero currently belongs to. */
export function computePersonalStats(raids: RaidDto[], previous?: RaidPersonalStats): RaidPersonalStats {
  const cleared = raids.filter((r) => r.isCompleted);
  const clearedRaidIds = cleared.map((r) => r.id);
  const bestShare = raids.reduce((best, raid) => {
    if (raid.targetAmount <= 0) return best;
    return Math.max(best, raid.yourContribution / raid.targetAmount);
  }, 0);
  const totalContribution = raids.reduce((sum, raid) => sum + Math.max(0, raid.yourContribution), 0);
  const lastRewardTitle =
    cleared.find((r) => r.rewardTitle)?.rewardTitle ?? previous?.lastRewardTitle ?? null;

  return {
    raidsCleared: clearedRaidIds.length,
    totalContribution,
    bestContributionShare: bestShare,
    clearedRaidIds,
    lastRewardTitle,
  };
}

function chronicleRaidVictory(raid: RaidDto) {
  const milestone = `Raid cleared: ${raid.sagaTitle || raid.title}`;
  const narrative = [
    `The party struck down "${raid.sagaTitle || raid.title}".`,
    `You contributed ${raid.yourContribution} of ${raid.targetAmount} ${raid.unitLabel}.`,
    raid.rewardTitle ? `Title earned: ${raid.rewardTitle}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  useJournalStore.getState().updateTodayEntry({
    narrative,
    milestones: [milestone],
  });
}

export const useRaidStore = create<RaidState>()(
  persist(
    (set, get) => ({
      raids: [],
      selectedRaidId: null,
      loading: false,
      mutating: false,
      error: null,
      personal: emptyRaidPersonal(),

      load: async () => {
        set({ loading: true, error: null });
        try {
          const raids = await raidApi.listMine();
          set({
            raids,
            personal: computePersonalStats(raids, get().personal),
            loading: false,
          });
        } catch (e) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load raids',
          });
        }
      },

      selectRaid: (id) => set({ selectedRaidId: id }),

      createRaid: async (req) => {
        set({ mutating: true, error: null });
        try {
          const raid = await raidApi.create(req);
          const raids = upsertRaid(get().raids, raid);
          set({
            raids,
            selectedRaidId: raid.id,
            personal: computePersonalStats(raids, get().personal),
            mutating: false,
          });
          return raid;
        } catch (e) {
          set({
            mutating: false,
            error: e instanceof Error ? e.message : 'Failed to create raid',
          });
          return null;
        }
      },

      joinRaid: async (inviteCode) => {
        set({ mutating: true, error: null });
        try {
          const raid = await raidApi.join(inviteCode);
          const raids = upsertRaid(get().raids, raid);
          set({
            raids,
            selectedRaidId: raid.id,
            personal: computePersonalStats(raids, get().personal),
            mutating: false,
          });
          return raid;
        } catch (e) {
          set({
            mutating: false,
            error: e instanceof Error ? e.message : 'Failed to join raid',
          });
          return null;
        }
      },

      contribute: async (raidId, amount, note) => {
        set({ mutating: true, error: null });
        try {
          const clientId = generateId();
          const result = await raidApi.contribute(raidId, amount, clientId, note);
          const wasCleared = get().personal.clearedRaidIds.includes(raidId);
          if (result.justCompleted && !wasCleared) {
            chronicleRaidVictory(result.raid);
          }
          const raids = upsertRaid(get().raids, result.raid);
          set({
            raids,
            personal: computePersonalStats(raids, get().personal),
            mutating: false,
          });
          return result.raid;
        } catch (e) {
          set({
            mutating: false,
            error: e instanceof Error ? e.message : 'Failed to log contribution',
          });
          return null;
        }
      },

      refreshRaid: async (raidId) => {
        try {
          const raid = await raidApi.get(raidId);
          const raids = upsertRaid(get().raids, raid);
          set({
            raids,
            personal: computePersonalStats(raids, get().personal),
          });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to refresh raid' });
        }
      },

      clear: () =>
        set({
          raids: [],
          selectedRaidId: null,
          loading: false,
          mutating: false,
          error: null,
          personal: emptyRaidPersonal(),
        }),
    }),
    {
      name: 'life-rpg-raids',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        personal: state.personal,
        selectedRaidId: state.selectedRaidId,
      }),
    },
  ),
);

export const RAID_STAT_OPTIONS: StatName[] = [
  'strength',
  'vitality',
  'intelligence',
  'charisma',
  'dexterity',
  'willpower',
];
