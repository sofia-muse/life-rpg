// Offline-first sync queue.
//
// Local Zustand+persist state is the source of truth for the UI. Mutations are enqueued here and
// flushed to the .NET `/sync` endpoint as one idempotent batch (each op carries a stable opId, so
// replays after a flaky connection are no-ops server-side). The queue itself is persisted to
// AsyncStorage so it survives app restarts.
//
// Quest *completion* is done online via the authoritative endpoint (questApi.complete) for its rich
// modal payload; only storage mutations (quest upsert/delete, hero settings) flow through here.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiFetch } from './client';
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
const MAX_RETRIES = 5;

class SyncManager {
  private queue: SyncOperation[] = [];
  private retries: Record<string, number> = {};
  private online = true;
  private hydrated = false;
  private flushing = false;
  private listeners = new Set<(pending: number) => void>();

  /** Load the persisted queue and start watching connectivity. Safe to call once at startup. */
  async init(): Promise<void> {
    if (this.hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) this.queue = JSON.parse(raw) as SyncOperation[];
    } catch {
      this.queue = [];
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
    try {
      const operations = this.queue.slice(0, 50);
      const result = await apiFetch<{ applied: string[]; skipped: string[] }>('/api/v1/sync', {
        method: 'POST',
        body: { lastSyncedAt: null, operations },
      });
      const settled = new Set([...result.applied, ...result.skipped]);
      this.queue = this.queue.filter((op) => !settled.has(op.opId));
      await this.persist();
    } catch {
      // Network/server error — bump retries; drop poison ops past the limit.
      for (const op of this.queue) {
        this.retries[op.opId] = (this.retries[op.opId] ?? 0) + 1;
      }
      this.queue = this.queue.filter((op) => (this.retries[op.opId] ?? 0) < MAX_RETRIES);
      await this.persist();
    } finally {
      this.flushing = false;
    }
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  subscribe(listener: (pending: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async persist(): Promise<void> {
    this.listeners.forEach((l) => l(this.queue.length));
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // ignore persistence failures
    }
  }
}

export const syncManager = new SyncManager();
