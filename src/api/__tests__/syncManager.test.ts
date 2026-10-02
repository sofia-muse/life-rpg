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
    const apiFetch = jest.fn(async () => ({
      serverTime: new Date().toISOString(),
      applied: ['op-1'],
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
    syncManager.enqueue('quest', 'upsert', { id: 'quest-1' });
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
