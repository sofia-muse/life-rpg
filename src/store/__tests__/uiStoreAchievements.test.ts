import { ACHIEVEMENT_DEFINITIONS } from '../../config/achievements';
import { useUIStore } from '../uiStore';

describe('uiStore achievement queue', () => {
  beforeEach(() => {
    useUIStore.setState({
      showAchievementModal: false,
      achievementData: null,
      achievementQueue: [],
    });
  });

  it('shows the first achievement and queues the rest', () => {
    const [a, b, c] = ACHIEVEMENT_DEFINITIONS;
    useUIStore.getState().enqueueAchievements([a!, b!, c!]);

    expect(useUIStore.getState().achievementData?.id).toBe(a!.id);
    expect(useUIStore.getState().achievementQueue.map((x) => x.id)).toEqual([b!.id, c!.id]);

    useUIStore.getState().dismissAchievement();
    expect(useUIStore.getState().achievementData?.id).toBe(b!.id);

    useUIStore.getState().dismissAchievement();
    expect(useUIStore.getState().achievementData?.id).toBe(c!.id);

    useUIStore.getState().dismissAchievement();
    expect(useUIStore.getState().showAchievementModal).toBe(false);
    expect(useUIStore.getState().achievementData).toBeNull();
  });
});
