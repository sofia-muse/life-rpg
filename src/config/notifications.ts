import { NotificationTemplate } from '../types';

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // Quest reminders
  {
    type: 'quest_reminder',
    title: 'Quest Awaits!',
    body: "Your daily quests are waiting, adventurer. Don't let them expire!",
  },
  {
    type: 'quest_reminder',
    title: 'Time to Grind',
    body: "Heroes don't take days off. Complete your quests!",
  },
  {
    type: 'quest_reminder',
    title: 'The Quest Board',
    body: 'New opportunities await on the quest board.',
  },

  // Streak warnings
  {
    type: 'streak_warning',
    title: 'Streak in Danger!',
    body: 'Your {streak}-day streak is at risk! Complete a quest to keep it alive.',
  },
  {
    type: 'streak_warning',
    title: "Don't Break the Chain!",
    body: "You've been consistent for {streak} days. Keep going!",
  },

  // Level up
  {
    type: 'level_up',
    title: 'Level Up! 🎉',
    body: 'Your {stat} reached level {level}! Keep pushing your limits.',
  },

  // Daily motivation
  {
    type: 'daily_motivation',
    title: 'Rise, Hero',
    body: 'A new day brings new quests. What will you conquer today?',
  },
  {
    type: 'daily_motivation',
    title: 'Adventure Awaits',
    body: 'The world needs heroes. Your quests await!',
  },
  {
    type: 'daily_motivation',
    title: 'Level Up Today',
    body: 'Every completed quest brings you closer to greatness.',
  },
];

export function getRandomTemplate(type: NotificationTemplate['type']): NotificationTemplate {
  const templates = NOTIFICATION_TEMPLATES.filter((t) => t.type === type);
  return templates[Math.floor(Math.random() * templates.length)];
}

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}
