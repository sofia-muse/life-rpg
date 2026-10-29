// Offline-first sync queue.
//
// Local Zustand+persist state is the source of truth for the UI. Mutations are enqueued here and
// flushed to the .NET `/sync` endpoint as one idempotent batch (each op carries a stable opId, so
// replays after a flaky connection are no-ops server-side). The queue itself is persisted to
// AsyncStorage so it survives app restarts.
//
// Quest *completion* is done online via the authoritative endpoint (questApi.complete) for its rich
// modal payload; storage mutations and client-managed hero state (appearance, settings, daily
// lifecycle, rest-day rewards) flow through here.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiFetch } from './client';
import { ApiHero, ApiQuest } from './dto';
import { mapApiHero, mapApiJournalEntry, mapApiQuest } from './mappers';
import { env } from '../config/env';
import { generateId } from '../utils/id';

export type SyncEntity = 'hero' | 'quest' | 'journal';
export type SyncActionType = 'upsert' | 'delete';

export interface SyncOperation {
  opId: string;
  entity: SyncEntity;
  action: SyncActionType;
  payload: unknown;
}

const QUEUE_KEY = 'life-rpg-sync-queue';
const LAST_SYNC_KEY = 'life-rpg-last-sync-at';
const CONFLICTS_KEY = 'life-rpg-sync-conflicts';

export interface SyncStatus {
  pending: number;
  conflicts: { opId: string; reason: string }[];
  state: 'idle' | 'syncing' | 'pending' | 'error' | 'conflict';
  lastError: string | null;
}

interface SyncBatchResponse {
  serverTime: string;
  applied: string[];
  skipped: string[];
  conflicts: { opId: string; reason: string }[];
  serverChanges: {
    /** Missing on older APIs, whose quest rows are a delta. */
    kind?: 'snapshot' | 'delta';
    hero: ApiHero | null;
    quests: ApiQuest[];
    journal: unknown[];
  };
}

class SyncManager {
  private queue: SyncOperation[] = [];
  private lastSyncedAt: string | null = null;
  private conflicts: Record<string, string> = {};
  private lastError: string | null = null;
  private online = true;
  private hydrated = false;
  private flushing = false;
  private listeners = new Set<(pending: number) => void>();
  private statusListeners = new Set<(status: SyncStatus) => void>();
  private persistence: Promise<void> = Promise.resolve();

  /** Load the persisted queue and start watching connectivity. Safe to call once at startup. */
  async init(): Promise<void> {
    if (this.hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) this.queue = JSON.parse(raw) as SyncOperation[];
      this.lastSyncedAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const conflicts = await AsyncStorage.getItem(CONFLICTS_KEY);
      if (conflicts) this.conflicts = JSON.parse(conflicts) as Record<string, string>;
    } catch {
      this.queue = [];
      this.lastSyncedAt = null;
    }
    this.hydrated = true;

    NetInfo.addEventListener((state) => {
      const wasOffline = !this.online;
      this.online = state.isConnected !== false;
      if (wasOffline && this.online) void this.flush();
    });
    void this.flush();
  }

  enqueue(entity: SyncEntity, action: SyncActionType, payload: unknown): void {
    // Sync is dormant in demo mode (no backend).
    if (env.demoMode) return;
    this.queue.push({ opId: generateId(), entity, action, payload });
    void this.persist();
    if (this.online) void this.flush();
  }

  async flush(): Promise<void> {
    if (env.demoMode || this.flushing || !this.online || this.queue.length === 0) return;
    this.flushing = true;
    this.lastError = null;
    this.notify();
    try {
      while (this.online && this.queue.length > 0) {
        const operations = this.queue.filter((op) => !this.conflicts[op.opId]).slice(0, 50);
        if (operations.length === 0) break;
        const result = await apiFetch<SyncBatchResponse>('/api/v1/sync', {
          method: 'POST',
          body: { lastSyncedAt: this.lastSyncedAt, operations },
        });
        const settled = new Set([
          ...result.applied,
          ...result.skipped,
        ]);
        for (const conflict of result.conflicts) this.conflicts[conflict.opId] = conflict.reason;
        this.queue = this.queue.filter((op) => !settled.has(op.opId));
        for (const opId of settled) delete this.conflicts[opId];
        this.lastSyncedAt = result.serverTime;
        this.applyServerChanges(result.serverChanges);
        await this.persist();
        // A malformed response must not spin forever or silently settle unsent work.
        if (!operations.some((op) => settled.has(op.opId) || this.conflicts[op.opId])) {
          this.lastError = 'The server did not acknowledge the pending changes. Retry sync.';
          break;
        }
      }
    } catch (error) {
      // Never discard unsaved progress because a network or server request failed.
      this.lastError = error instanceof Error ? error.message : 'Sync failed. Your changes are saved on this device.';
      await this.persist();
    } finally {
      this.flushing = false;
      this.notify();
    }
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  subscribe(listener: (pending: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return {
      pending: this.queue.length,
      conflicts: Object.entries(this.conflicts).map(([opId, reason]) => ({ opId, reason })),
      state: this.flushing ? 'syncing' : Object.keys(this.conflicts).length > 0 ? 'conflict'
        : this.lastError ? 'error' : this.queue.length > 0 ? 'pending' : 'idle',
      lastError: this.lastError,
    };
  }

  subscribeStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** Retry retained operations. Conflicts are preserved until a caller explicitly retries. */
  async retryPending(): Promise<void> {
    this.conflicts = {};
    this.lastError = null;
    await this.persist();
    await this.flush();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.queue.length));
    this.statusListeners.forEach((listener) => listener(this.getStatus()));
  }

  private async persist(): Promise<void> {
    this.notify();
    const queue = JSON.stringify(this.queue);
    const conflicts = JSON.stringify(this.conflicts);
    const lastSyncedAt = this.lastSyncedAt;
    // Serialize writes so a slow older enqueue cannot overwrite a newer queue snapshot.
    this.persistence = this.persistence.then(async () => {
      await AsyncStorage.setItem(QUEUE_KEY, queue);
      await AsyncStorage.setItem(CONFLICTS_KEY, conflicts);
      if (lastSyncedAt) await AsyncStorage.setItem(LAST_SYNC_KEY, lastSyncedAt);
      else await AsyncStorage.removeItem(LAST_SYNC_KEY);
    }).catch(() => {
      this.lastError = 'Device storage is unavailable. Keep this app open and retry sync.';
      this.notify();
    });
    await this.persistence;
  }

  private applyServerChanges(changes: SyncBatchResponse['serverChanges']): void {
    const { useHeroStore } = require('../store/heroStore') as typeof import('../store/heroStore');
    const { useQuestStore } = require('../store/questStore') as typeof import('../store/questStore');
    const { useSettingsStore } = require('../store/settingsStore') as typeof import('../store/settingsStore');
    const { useSkillStore } = require('../store/skillStore') as typeof import('../store/skillStore');

    if (changes.hero && !this.queue.some((op) => op.entity === 'hero')) {
      useHeroStore.getState().setHero(mapApiHero(changes.hero), { isOnboarded: true });
      useSkillStore.getState().replaceUnlockedSkills(changes.hero.unlockedSkills);
      useSettingsStore.getState().replaceSettings(changes.hero.settings);
    }

    if (changes.kind === 'snapshot' || changes.quests.length > 0) {
      const localQuests = useQuestStore.getState().quests;
      const quests = new Map((changes.kind === 'snapshot' ? [] : localQuests).map((quest) => [quest.id, quest]));
      for (const quest of changes.quests.map(mapApiQuest)) quests.set(quest.id, quest);
      // A response can arrive while newer changes are queued. Preserve those local edits,
      // including deletes, until the server acknowledges their own operation IDs.
      for (const op of this.queue.filter((operation) => operation.entity === 'quest')) {
        const id = (op.payload as { id?: string })?.id;
        if (!id) continue;
        if (op.action === 'delete') quests.delete(id);
        else {
          const local = localQuests.find((quest) => quest.id === id);
          if (local) quests.set(id, local);
        }
      }
      useQuestStore.getState().replaceQuests([...quests.values()]);
    }

    if (Array.isArray(changes.journal) && changes.journal.length > 0) {
      const { useJournalStore } = require('../store/journalStore') as typeof import('../store/journalStore');
      for (const raw of changes.journal as Array<Record<string, unknown>>) {
        const entry = mapApiJournalEntry(raw);
        const pending = this.queue.some((op) => op.entity === 'journal'
          && ((op.payload as { id?: string; date?: string })?.id === entry?.id
            || (op.payload as { date?: string })?.date === entry?.date));
        if (entry && !pending) {
          useJournalStore.getState().applyServerJournalEntry(entry);
        }
      }
    }
  }
}

export const syncManager = new SyncManager();
