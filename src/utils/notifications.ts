import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { fillTemplate, getRandomTemplate } from '../config/notifications';

const QUEST_REMINDER_ID = 'life-rpg-quest-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function parseReminderTime(reminderTime: string): { hour: number; minute: number } {
  const [h, m] = reminderTime.split(':').map((part) => Number.parseInt(part, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/** Schedule a daily local quest reminder using settings reminder time. */
export async function scheduleQuestReminders(reminderTime: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission?.granted) return;

    await Notifications.cancelScheduledNotificationAsync(QUEST_REMINDER_ID).catch(() => undefined);

    const template = getRandomTemplate('quest_reminder');
    const { hour, minute } = parseReminderTime(reminderTime);

    await Notifications.scheduleNotificationAsync({
      identifier: QUEST_REMINDER_ID,
      content: {
        title: template.title,
        body: fillTemplate(template.body, {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (error) {
    console.warn('[Notifications] Failed to schedule quest reminder.', error);
  }
}

export async function cancelQuestReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(QUEST_REMINDER_ID);
  } catch {
    // ignore
  }
}
