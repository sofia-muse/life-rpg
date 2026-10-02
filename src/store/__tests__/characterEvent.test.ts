import { CHARACTER_EVENT_HOLD_MS, useUIStore } from '../uiStore';
import { useHeroStore } from '../heroStore';
import { useSettingsStore } from '../settingsStore';
import { presentQuestCompletionFeedback } from '../../utils/questCompletionFeedback';
import { MOOD_MOTION } from '../../components/avatar/anime/useCharacterAnimations';
import { buildNiceAvatarConfig } from '../../config/anime/niceAvatarConfig';
import { getDefaultCharacterAppearance } from '../../config/appearanceConfig';
import { Quest, StatLevelUpResult } from '../../types';

function quest(): Quest {
  return {
    id: 'q1',
    title: 'Morning stretch',
    description: 'Stretch',
    type: 'daily',
    difficulty: 'easy',
    stat: 'vitality',
    xpReward: 15,
    isCompleted: true,
    isActive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    streak: 1,
    bestStreak: 1,
    daysCompleted: 1,
  };
}

function levelResult(withTier: boolean): StatLevelUpResult {
  return {
    stat: 'vitality',
    oldLevel: 1,
    newLevel: 2,
    newSkills: [],
    tierUp: withTier ? { newTier: 2, newClass: 'Warden' } : undefined,
  };
}

describe('character reactions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useUIStore.setState({
      characterEvent: 'idle',
      characterEventNonce: 0,
      showLevelUpModal: false,
      levelUpData: null,
      showTierUpModal: false,
      tierUpData: null,
      showXPPopup: false,
      xpPopupData: null,
    });
    useUIStore.getState().setCharacterEvent('idle');
  });

  afterEach(() => {
    useUIStore.getState().setCharacterEvent('idle');
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('replays the same reaction and then returns the portrait to idle', () => {
    useUIStore.getState().setCharacterEvent('questComplete');
    const first = useUIStore.getState().characterEventNonce;
    useUIStore.getState().setCharacterEvent('questComplete');

    expect(useUIStore.getState().characterEvent).toBe('questComplete');
    expect(useUIStore.getState().characterEventNonce).toBeGreaterThan(first);

    jest.advanceTimersByTime(CHARACTER_EVENT_HOLD_MS.questComplete);
    expect(useUIStore.getState().characterEvent).toBe('idle');
  });

  it('keeps a newer reaction when an older one would have ended', () => {
    useUIStore.getState().setCharacterEvent('questComplete');
    jest.advanceTimersByTime(400);
    useUIStore.getState().setCharacterEvent('levelUp');
    jest.advanceTimersByTime(CHARACTER_EVENT_HOLD_MS.questComplete);

    expect(useUIStore.getState().characterEvent).toBe('levelUp');

    jest.advanceTimersByTime(CHARACTER_EVENT_HOLD_MS.levelUp);
    expect(useUIStore.getState().characterEvent).toBe('idle');
  });

  it('plays a level-up pose after a quest that raises a stat', () => {
    const previousHero = useHeroStore.getState().hero;
    const previousHaptic = useSettingsStore.getState().hapticEnabled;
    useHeroStore.setState({ hero: null });
    useSettingsStore.setState({ hapticEnabled: false });

    presentQuestCompletionFeedback(undefined, {
      quest: quest(),
      completed: true,
      xpAwarded: 15,
      levelResult: levelResult(true),
      newSkills: [],
      appearanceUnlock: null,
      stepAdvancedOnly: false,
    });

    expect(useUIStore.getState().characterEvent).toBe('questComplete');

    jest.advanceTimersByTime(1200);
    expect(useUIStore.getState().characterEvent).toBe('levelUp');
    expect(useUIStore.getState().showLevelUpModal).toBe(true);

    jest.advanceTimersByTime(1300);
    expect(useUIStore.getState().characterEvent).toBe('tierUp');
    expect(useUIStore.getState().showTierUpModal).toBe(true);

    useHeroStore.setState({ hero: previousHero });
    useSettingsStore.setState({ hapticEnabled: previousHaptic });
  });

  it('gives a happy hero a livelier idle and closes the eyes on a blink', () => {
    expect(MOOD_MOTION.happy.lift).toBeGreaterThan(MOOD_MOTION.neutral.lift);
    expect(MOOD_MOTION.neutral.lift).toBeGreaterThan(MOOD_MOTION.sad.lift);
    expect(MOOD_MOTION.happy.breathMs).toBeLessThan(MOOD_MOTION.sad.breathMs);

    const appearance = getDefaultCharacterAppearance();
    const open = buildNiceAvatarConfig(appearance, 'strength', 1, 'neutral', false);
    const closed = buildNiceAvatarConfig(appearance, 'strength', 1, 'sad', true);

    expect(open.eyeStyle).toBe('oval');
    expect(closed.eyeStyle).toBe('smile');
  });
});
