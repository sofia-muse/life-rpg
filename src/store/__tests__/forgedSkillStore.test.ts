import { skillApi } from '../../api/skillApi';
import { useForgedSkillStore } from '../forgedSkillStore';
import { getSkillBonusForStat } from '../../engine/skillEngine';
import { registerForgedSkills } from '../../config/skills';

jest.mock('../../api/skillApi', () => ({
  skillApi: { forge: jest.fn(), listForged: jest.fn() },
}));

jest.mock('../../config/env', () => ({
  env: { apiUrl: 'http://localhost:5005', demoMode: false },
}));

describe('forgedSkillStore', () => {
  beforeEach(() => {
    useForgedSkillStore.setState({ forged: [], loading: false, error: null });
    registerForgedSkills([]);
    jest.clearAllMocks();
  });

  it('forge() adds the skill and its bonus is counted for the matching stat', async () => {
    (skillApi.forge as jest.Mock).mockResolvedValue({
      id: 'forged-1',
      name: 'Iron Surge',
      description: 'Raw power.',
      category: 'strength',
      icon: '💪',
      effect: '+8% XP on Strength quests',
    });

    const skill = await useForgedSkillStore.getState().forge();

    expect(skill?.name).toBe('Iron Surge');
    expect(useForgedSkillStore.getState().forged).toHaveLength(1);
    // Forged skills are always active, so the bonus applies without being in the unlocked list.
    expect(getSkillBonusForStat('strength', [])).toBe(8);
    expect(getSkillBonusForStat('vitality', [])).toBe(0);
  });

  it('forge() surfaces an error and adds nothing on failure', async () => {
    (skillApi.forge as jest.Mock).mockRejectedValue(new Error('network'));

    const skill = await useForgedSkillStore.getState().forge();

    expect(skill).toBeNull();
    expect(useForgedSkillStore.getState().forged).toHaveLength(0);
    expect(useForgedSkillStore.getState().error).toBe('network');
  });
});
