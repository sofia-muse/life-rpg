// Offline sync queue skeleton
// When Supabase is configured, this will:
// 1. Queue mutations when offline
// 2. Replay them when connectivity returns
// 3. Handle conflict resolution

interface SyncAction {
  id: string;
  type: 'save_hero' | 'save_quest' | 'complete_quest' | 'delete_quest';
  payload: unknown;
  timestamp: string;
  retries: number;
}

class SyncManager {
  private queue: SyncAction[] = [];
  private isOnline = true;

  enqueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retries'>) {
    this.queue.push({
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    if (this.isOnline) {
      this.flush();
    }
  }

  async flush() {
    // TODO: Process queue items and call Supabase APIs
    // For now, just clear the queue
    this.queue = [];
  }

  setOnline(online: boolean) {
    this.isOnline = online;
    if (online) this.flush();
  }

  getPendingCount() {
    return this.queue.length;
  }
}

export const syncManager = new SyncManager();
