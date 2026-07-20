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
import { applyApiHeroSnapshot } from './applyApiHeroSnapshot';
import { apiFetch } from './client';
import { ApiHero, ApiQuest } from './dto';
import { mapApiQuest } from './mappers';
import { env } from '../config/env';
import { generateId } from '../utils/id';

export type SyncEntity = 'hero' | 'quest';
export type SyncActionType = 'upsert' | 'delete';

export interface SyncOperation {
  opId: string;
  entity: SyncEntity;
  action: SyncActionType;
  payload: unknown;
}

const QUEUE_KEY = 'life-rpg-sync-queue';
const LAST_SYNC_KEY = 'life-rpg-last-sync-at';
const MAX_RETRIES = 5;
/** Coalesce burst enqueue (quest + hero) into one disk write + one flush. */
const PERSIST_FLUSH_DEBOUNCE_MS = 100;

interface SyncBatchResponse {
  serverTime: string;
  applied: string[];
  skipped: string[];
  conflicts: { opId: string; reason: string }[];
  serverChanges: {
    hero: ApiHero | null;
    quests: ApiQuest[];
    journal: unknown[];
  };
}

class SyncManager {
  private queue: SyncOperation[] = [];
  private lastSyncedAt: string | null = null;
  private retries: Record<string, number> = {};
  private online = true;
  private hydrated = false;
  private listeners = new Set<(pending: number) => void>();
  private persistFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private persistFlushGeneration = 0;
  private flushPromise: Promise<void> | null = null;

  /** Load the persisted queue and start watching connectivity. Safe to call once at startup. */
  async init(): Promise<void> {
    if (this.hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) this.queue = JSON.parse(raw) as SyncOperation[];
      this.lastSyncedAt = await AsyncStorage.getItem(LAST_SYNC_KEY);
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
    this.listeners.forEach((l) => l(this.queue.length));
    this.schedulePersistAndFlush();
  }

  /** Immediate flush (e.g. coming back online). Cancels any pending debounce. */
  async flush(): Promise<void> {
    this.cancelScheduledPersistFlush();
    await this.persist();
    await this.flushNow();
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  subscribe(listener: (pending: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private schedulePersistAndFlush(): void {
    if (this.persistFlushTimer) clearTimeout(this.persistFlushTimer);
    const generation = this.persistFlushGeneration;
    this.persistFlushTimer = setTimeout(() => {
      this.persistFlushTimer = null;
      void (async () => {
        if (generation !== this.persistFlushGeneration) return;
        await this.persist();
        if (generation !== this.persistFlushGeneration) return;
        if (this.online) await this.flushNow();
      })();
    }, PERSIST_FLUSH_DEBOUNCE_MS);
  }

  private cancelScheduledPersistFlush(): void {
    this.persistFlushGeneration += 1;
    if (this.persistFlushTimer) {
      clearTimeout(this.persistFlushTimer);
      this.persistFlushTimer = null;
    }
  }

  private async flushNow(): Promise<void> {
    if (this.flushPromise) return this.flushPromise;
    if (env.demoMode || !this.online || this.queue.length === 0) return;

    this.flushPromise = this.runFlushLoop();
    try {
      await this.flushPromise;
    } finally {
      this.flushPromise = null;
    }
  }

  private async runFlushLoop(): Promise<void> {
    try {
      while (this.online && this.queue.length > 0) {
        const operations = this.queue.slice(0, 50);
        const result = await apiFetch<SyncBatchResponse>('/api/v1/sync', {
          method: 'POST',
          body: { lastSyncedAt: this.lastSyncedAt, operations },
        });
        const settled = new Set([
          ...result.applied,
          ...result.skipped,
          ...result.conflicts.map((conflict) => conflict.opId),
        ]);
        this.queue = this.queue.filter((op) => !settled.has(op.opId));
        this.lastSyncedAt = result.serverTime;
        this.applyServerChanges(result.serverChanges);
        await this.persist();
      }
    } catch {
      // Network/server error — bump retries; drop poison ops past the limit.
      for (const op of this.queue.slice(0, 50)) {
        this.retries[op.opId] = (this.retries[op.opId] ?? 0) + 1;
      }
      this.queue = this.queue.filter((op) => (this.retries[op.opId] ?? 0) < MAX_RETRIES);
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    this.listeners.forEach((l) => l(this.queue.length));
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      if (this.lastSyncedAt) {
        await AsyncStorage.setItem(LAST_SYNC_KEY, this.lastSyncedAt);
      } else {
        await AsyncStorage.removeItem(LAST_SYNC_KEY);
      }
    } catch {
      // ignore persistence failures
    }
  }

  private applyServerChanges(changes: SyncBatchResponse['serverChanges']): void {
    if (changes.hero) {
      applyApiHeroSnapshot(changes.hero);
    }

    if (changes.quests.length > 0) {
      const { useQuestStore } = require('../store/questStore') as typeof import('../store/questStore');
      useQuestStore.getState().replaceQuests(changes.quests.map(mapApiQuest));
    }
  }
}

export const syncManager = new SyncManager();
