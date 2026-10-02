import { useJournalStore } from '../journalStore';

describe('journalStore.applyServerJournalEntry', () => {
  beforeEach(() => {
    useJournalStore.setState({ entries: [] });
  });

  it('adds a past-date server entry without overwriting today', () => {
    const today = new Date().toISOString().split('T')[0]!;
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]!;

    useJournalStore.getState().updateTodayEntry({ narrative: 'Today local' });
    useJournalStore.getState().applyServerJournalEntry({
      id: 'server-yesterday',
      date: yesterdayStr,
      narrative: 'Yesterday from server',
      questsCompleted: [],
      xpGained: {
        strength: 0,
        vitality: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        willpower: 0,
      },
      levelsGained: [],
      skillsUnlocked: [],
      milestones: ['Raid cleared'],
    });

    const entries = useJournalStore.getState().entries;
    expect(entries.find((e) => e.date === yesterdayStr)?.narrative).toBe('Yesterday from server');
    expect(entries.find((e) => e.date === today)?.narrative).toBe('Today local');
    expect(entries).toHaveLength(2);
  });
});
