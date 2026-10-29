describe('syncManager', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('flush drains more than one batch of queued operations', async () => {
    const apiFetch = jest.fn(async (_path: string, options?: { body?: { operations?: { opId: string }[] } }) => ({
      serverTime: new Date().toISOString(),
      applied: (options?.body?.operations ?? []).map((operation) => operation.opId),
      skipped: [],
      conflicts: [],
      serverChanges: {
        hero: null,
        quests: [],
        journal: [],
      },
    }));

    jest.doMock('../client', () => ({ apiFetch, ApiError: class ApiError extends Error {} }));
    jest.doMock('../../config/env', () => ({ env: { demoMode: false, apiUrl: 'http://localhost:5005' } }));
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@react-native-community/netinfo', () => ({
      __esModule: true,
      default: { addEventListener: jest.fn() },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncManager } = require('../syncManager') as typeof import('../syncManager');

    await syncManager.init();
    (syncManager as any).online = false;

    for (let i = 0; i < 60; i += 1) {
      syncManager.enqueue('quest', 'upsert', { id: `quest-${i}` });
    }

    (syncManager as any).online = true;
    await syncManager.flush();

    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(syncManager.getPendingCount()).toBe(0);
  });

  it('hydrates server journal entries by date from sync response', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;

    const applyServerJournalEntry = jest.fn();
    const apiFetch = jest.fn(async (_path: string, options?: { body?: { operations?: { opId: string }[] } }) => ({
      serverTime: new Date().toISOString(),
      applied: (options?.body?.operations ?? []).map((operation) => operation.opId),
      skipped: [],
      conflicts: [],
      serverChanges: {
        hero: null,
        quests: [],
        journal: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            date: yesterdayStr,
            narrative: 'Synced yesterday',
            milestones: ['Boss saga'],
            xpGained: { strength: 5 },
            levelsGained: [],
          },
        ],
      },
    }));

    jest.doMock('../client', () => ({ apiFetch, ApiError: class ApiError extends Error {} }));
    jest.doMock('../../config/env', () => ({ env: { demoMode: false, apiUrl: 'http://localhost:5005' } }));
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@react-native-community/netinfo', () => ({
      __esModule: true,
      default: { addEventListener: jest.fn() },
    }));
    jest.doMock('../../store/journalStore', () => ({
      useJournalStore: { getState: () => ({ applyServerJournalEntry }) },
    }));
    jest.doMock('../../store/heroStore', () => ({
      useHeroStore: { getState: () => ({ setHero: jest.fn() }) },
    }));
    jest.doMock('../../store/questStore', () => ({
      useQuestStore: { getState: () => ({ replaceQuests: jest.fn() }) },
    }));
    jest.doMock('../../store/settingsStore', () => ({
      useSettingsStore: { getState: () => ({ replaceSettings: jest.fn() }) },
    }));
    jest.doMock('../../store/skillStore', () => ({
      useSkillStore: { getState: () => ({ replaceUnlockedSkills: jest.fn() }) },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncManager } = require('../syncManager') as typeof import('../syncManager');

    await syncManager.init();
    (syncManager as any).online = false;
    syncManager.enqueue('quest', 'upsert', { id: 'quest-1' });
    (syncManager as any).online = true;
    await syncManager.flush();

    expect(applyServerJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        date: yesterdayStr,
        narrative: 'Synced yesterday',
        milestones: ['Boss saga'],
      }),
    );
  });
});

describe('sync recovery regressions', () => {
  const setup = async (apiFetch: jest.Mock, initialQuests: any[] = []) => {
    jest.resetModules();
    let quests = initialQuests;
    const replaceQuests = jest.fn((next: any[]) => { quests = next; });
    jest.doMock('../client', () => ({ apiFetch, ApiError: class ApiError extends Error {} }));
    jest.doMock('../../config/env', () => ({ env: { demoMode: false } }));
    jest.doMock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined), removeItem: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('@react-native-community/netinfo', () => ({ __esModule: true, default: { addEventListener: jest.fn() } }));
    jest.doMock('../../store/questStore', () => ({ useQuestStore: { getState: () => ({ quests, replaceQuests }) } }));
    jest.doMock('../../store/heroStore', () => ({ useHeroStore: { getState: () => ({ setHero: jest.fn() }) } }));
    jest.doMock('../../store/settingsStore', () => ({ useSettingsStore: { getState: () => ({ replaceSettings: jest.fn() }) } }));
    jest.doMock('../../store/skillStore', () => ({ useSkillStore: { getState: () => ({ replaceUnlockedSkills: jest.fn() }) } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncManager } = require('../syncManager') as typeof import('../syncManager');
    await syncManager.init();
    (syncManager as any).online = false;
    return { syncManager, replaceQuests, getQuests: () => quests };
  };
  const response = (ops: any[], quests: any[] = [], kind?: string) => ({ serverTime: new Date().toISOString(), applied: ops.map((op) => op.opId), skipped: [], conflicts: [], serverChanges: { kind, hero: null, quests, journal: [] } });
  const row = (id: string) => ({ id, title: id, type: 'side', difficulty: 'easy', stat: 'strength', xpReward: 15, isCompleted: false, isActive: true, createdAt: '', updatedAt: '', streak: 0, bestStreak: 0, daysCompleted: 0 });

  it('retains work after more than five temporary failures and succeeds on retry', async () => {
    const api = jest.fn().mockRejectedValue(new Error('Temporary outage'));
    const { syncManager } = await setup(api);
    syncManager.enqueue('quest', 'upsert', { id: 'q' });
    (syncManager as any).online = true;
    for (let attempt = 0; attempt < 7; attempt++) await syncManager.flush();
    expect(syncManager.getPendingCount()).toBe(1);
    expect(syncManager.getStatus().state).toBe('error');
    api.mockImplementation(async (_: string, options: any) => response(options.body.operations));
    await syncManager.retryPending();
    expect(syncManager.getPendingCount()).toBe(0);
    expect(syncManager.getStatus().state).toBe('idle');
  });

  it('merges legacy delta responses without dropping unchanged quests', async () => {
    const api = jest.fn(async (_: string, options: any) => response(options.body.operations, [row('changed')]));
    const { syncManager, getQuests } = await setup(api, [row('unchanged'), row('changed')]);
    syncManager.enqueue('hero', 'upsert', { name: 'Hero' });
    (syncManager as any).online = true;
    await syncManager.flush();
    expect(getQuests().map((q) => q.id).sort()).toEqual(['changed', 'unchanged']);
  });

  it('snapshot removes acknowledged deletes but keeps conflicted local changes', async () => {
    const api = jest.fn(async (_: string, options: any) => ({ ...response([], [row('server')], 'snapshot'), conflicts: options.body.operations.map((op: any) => ({ opId: op.opId, reason: 'Needs review' })) }));
    const { syncManager, getQuests } = await setup(api, [row('local'), row('removed')]);
    syncManager.enqueue('quest', 'upsert', row('local'));
    (syncManager as any).online = true;
    await syncManager.flush();
    expect(getQuests().map((q) => q.id).sort()).toEqual(['local', 'server']);
    expect(syncManager.getStatus().conflicts).toHaveLength(1);
    expect(syncManager.getPendingCount()).toBe(1);
    await syncManager.flush();
    expect(api).toHaveBeenCalledTimes(1);
  });
});
