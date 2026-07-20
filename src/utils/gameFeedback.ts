import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type FeedbackEvent = 'questComplete' | 'levelUp' | 'tierUp' | 'dailyReward' | 'evolution' | 'bossPhase';

export async function playGameFeedback(
  event: FeedbackEvent,
  hapticEnabled: boolean,
): Promise<void> {
  if (!hapticEnabled || Platform.OS === 'web') return;

  switch (event) {
    case 'questComplete':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'levelUp':
    case 'tierUp':
    case 'evolution':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'dailyReward':
    case 'bossPhase':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    default:
      break;
  }
}

export function getTimeOfDayGreeting(now = new Date()): { greeting: string; period: 'dawn' | 'day' | 'dusk' | 'night' } {
  const hour = now.getHours();
  if (hour >= 5 && hour < 10) {
    return { greeting: 'Dawn breaks over the sanctuary.', period: 'dawn' };
  }
  if (hour >= 10 && hour < 17) {
    return { greeting: 'The day is yours to shape.', period: 'day' };
  }
  if (hour >= 17 && hour < 21) {
    return { greeting: 'Twilight settles. One more quest?', period: 'dusk' };
  }
  return { greeting: 'The night watches. Rest well, hero.', period: 'night' };
}

export const PERIOD_GRADIENTS = {
  dawn: ['rgba(255, 183, 77, 0.12)', 'rgba(124, 92, 252, 0.06)'],
  day: ['rgba(255, 255, 255, 0.06)', 'rgba(124, 92, 252, 0.08)'],
  dusk: ['rgba(196, 169, 98, 0.14)', 'rgba(124, 92, 252, 0.06)'],
  night: ['rgba(60, 60, 120, 0.2)', 'rgba(15, 15, 26, 0.4)'],
} as const;
