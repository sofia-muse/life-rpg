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
});
