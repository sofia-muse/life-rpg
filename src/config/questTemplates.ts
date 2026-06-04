import { StatName, Gender, QuestDifficulty, QuestType } from '../types';
import { applyGenderScaling } from './questScaling';

export interface QuestTemplate {
  title: string;
  description: string;
  stat: StatName;
  type: QuestType;
  difficulty: QuestDifficulty;
  totalSteps?: number; // for boss quests
}

// ─── Daily Quest Templates ───

const DAILY_TEMPLATES: Record<StatName, Omit<QuestTemplate, 'stat' | 'type'>[]> = {
  strength: [
    {
      title: '20 Push-ups',
      description: 'Complete 20 push-ups to build upper body strength.',
      difficulty: 'easy',
    },
    {
      title: '30-min Workout',
      description: 'Complete a 30-minute workout session.',
      difficulty: 'medium',
    },
    {
      title: '10,000 Steps',
      description: 'Walk at least 10,000 steps today.',
      difficulty: 'medium',
    },
    {
      title: '50 Squats',
      description: 'Do 50 bodyweight squats throughout the day.',
      difficulty: 'easy',
    },
    {
      title: 'Stretch for 15 Minutes',
      description: 'Do a full-body stretching routine.',
      difficulty: 'easy',
    },
    {
      title: '1-Hour Gym Session',
      description: 'Hit the gym for a full hour of training.',
      difficulty: 'hard',
    },
    {
      title: 'Plank Challenge',
      description: 'Hold a plank for 2 minutes total (can be split).',
      difficulty: 'medium',
    },
    {
      title: 'Take the Stairs',
      description: 'Use stairs instead of elevators all day.',
      difficulty: 'easy',
    },
  ],
  vitality: [
    {
      title: 'Drink 8 Glasses of Water',
      description: 'Stay hydrated throughout the day.',
      difficulty: 'easy',
    },
    {
      title: '7+ Hours Sleep',
      description: 'Get a full night of quality sleep.',
      difficulty: 'medium',
    },
    {
      title: 'Eat a Home-Cooked Meal',
      description: 'Prepare and eat at least one healthy meal.',
      difficulty: 'easy',
    },
    {
      title: 'No Junk Food',
      description: 'Avoid processed snacks and fast food today.',
      difficulty: 'medium',
    },
    {
      title: 'Eat 5 Servings of Veggies',
      description: 'Hit your daily vegetable goal.',
      difficulty: 'hard',
    },
    {
      title: 'No Caffeine After 2pm',
      description: 'Let your body wind down naturally.',
      difficulty: 'easy',
    },
    {
      title: 'Take Vitamins',
      description: 'Remember to take your daily supplements.',
      difficulty: 'easy',
    },
    {
      title: 'Screen-Free Before Bed',
      description: 'No screens 30 minutes before sleeping.',
      difficulty: 'medium',
    },
  ],
  intelligence: [
    {
      title: 'Read for 30 Minutes',
      description: 'Read a book or educational article.',
      difficulty: 'medium',
    },
    {
      title: 'Learn Something New',
      description: 'Watch a tutorial or take a lesson on a new topic.',
      difficulty: 'medium',
    },
    {
      title: 'Solve a Puzzle',
      description: 'Complete a crossword, sudoku, or brain teaser.',
      difficulty: 'easy',
    },
    {
      title: 'Write in a Journal',
      description: 'Reflect on your day in writing for 10+ minutes.',
      difficulty: 'easy',
    },
    {
      title: 'Practice a Skill for 1 Hour',
      description: 'Dedicate focused time to learning a skill.',
      difficulty: 'hard',
    },
    {
      title: 'Listen to an Educational Podcast',
      description: 'Listen to a podcast episode that teaches something.',
      difficulty: 'easy',
    },
    {
      title: 'Review Your Notes',
      description: "Spend 15 minutes reviewing things you've learned recently.",
      difficulty: 'easy',
    },
    {
      title: 'Teach Someone Something',
      description: 'Explain a concept to someone else to solidify your knowledge.',
      difficulty: 'medium',
    },
  ],
  charisma: [
    {
      title: 'Reach Out to a Friend',
      description: 'Send a meaningful message to someone you care about.',
      difficulty: 'easy',
    },
    {
      title: 'Practice Active Listening',
      description: 'Have a conversation where you focus entirely on the other person.',
      difficulty: 'medium',
    },
    {
      title: 'Give a Genuine Compliment',
      description: "Brighten someone's day with honest praise.",
      difficulty: 'easy',
    },
    {
      title: 'Start a Conversation with a Stranger',
      description: 'Break the ice with someone new.',
      difficulty: 'hard',
    },
    {
      title: 'Call a Family Member',
      description: 'Have a real phone conversation with family.',
      difficulty: 'easy',
    },
    {
      title: 'Help Someone',
      description: 'Go out of your way to assist another person.',
      difficulty: 'medium',
    },
    {
      title: 'Practice Public Speaking',
      description: 'Rehearse a presentation or practice speaking aloud.',
      difficulty: 'medium',
    },
    {
      title: 'Write a Thank You Note',
      description: 'Express gratitude to someone in writing.',
      difficulty: 'easy',
    },
  ],
  dexterity: [
    {
      title: 'Complete Top 3 Tasks',
      description: 'Finish your three most important tasks today.',
      difficulty: 'medium',
    },
    {
      title: 'No Phone for 1 Hour',
      description: 'Put your phone away and focus deeply on one task.',
      difficulty: 'medium',
    },
    {
      title: 'Time Block Your Day',
      description: 'Plan your day in 30-minute blocks and follow through.',
      difficulty: 'hard',
    },
    {
      title: 'Inbox Zero',
      description: 'Process all emails and messages — reply, archive, or delete.',
      difficulty: 'medium',
    },
    {
      title: 'Declutter One Area',
      description: 'Tidy up your desk, a drawer, or a folder.',
      difficulty: 'easy',
    },
    {
      title: '2-Minute Rule',
      description: 'Do every task that takes under 2 minutes immediately.',
      difficulty: 'easy',
    },
    {
      title: 'Single-Task for 45 Minutes',
      description: 'Work on one thing without switching tasks.',
      difficulty: 'medium',
    },
    {
      title: 'Plan Tomorrow Tonight',
      description: 'Write down your tasks for tomorrow before bed.',
      difficulty: 'easy',
    },
  ],
  willpower: [
    {
      title: 'Meditate for 10 Minutes',
      description: 'Practice mindfulness meditation.',
      difficulty: 'medium',
    },
    {
      title: 'Cold Shower',
      description: 'Take a cold shower to build mental toughness.',
      difficulty: 'hard',
    },
    {
      title: 'No Social Media',
      description: 'Stay off social media for the entire day.',
      difficulty: 'hard',
    },
    {
      title: 'Wake Up Early',
      description: 'Get up at your target time without hitting snooze.',
      difficulty: 'medium',
    },
    {
      title: 'Resist a Temptation',
      description: 'Say no to one unhealthy craving or impulse today.',
      difficulty: 'easy',
    },
    {
      title: 'Gratitude List',
      description: "Write down 3 things you're grateful for.",
      difficulty: 'easy',
    },
    {
      title: 'Breathwork Session',
      description: 'Do 5 minutes of intentional breathing exercises.',
      difficulty: 'easy',
    },
    {
      title: 'Do the Hard Thing First',
      description: 'Tackle your most dreaded task before anything else.',
      difficulty: 'medium',
    },
  ],
};

// ─── Side Quest Templates ───

const SIDE_TEMPLATES: Record<StatName, Omit<QuestTemplate, 'stat' | 'type'>[]> = {
  strength: [
    {
      title: 'Run a 5K',
      description: 'Complete a 5-kilometer run without stopping.',
      difficulty: 'hard',
    },
    {
      title: 'Try a New Sport',
      description: "Play a sport you've never tried before.",
      difficulty: 'medium',
    },
    {
      title: 'Do 100 Push-ups in a Day',
      description: 'Spread throughout the day — just hit 100 total.',
      difficulty: 'hard',
    },
    {
      title: 'Hike a Trail',
      description: 'Complete a nature hike of at least 3 miles.',
      difficulty: 'medium',
    },
  ],
  vitality: [
    {
      title: 'Cook a New Recipe',
      description: "Prepare a healthy dish you've never made before.",
      difficulty: 'medium',
    },
    {
      title: 'Meal Prep Sunday',
      description: 'Prepare healthy meals for the upcoming week.',
      difficulty: 'hard',
    },
    {
      title: 'Doctor Check-up',
      description: 'Schedule and attend a routine health appointment.',
      difficulty: 'medium',
    },
    {
      title: 'Digital Detox Day',
      description: 'Spend an entire day with minimal screen time.',
      difficulty: 'hard',
    },
  ],
  intelligence: [
    {
      title: 'Finish a Book',
      description: 'Complete an entire book cover to cover.',
      difficulty: 'hard',
    },
    {
      title: 'Take an Online Course Lesson',
      description: 'Complete one full lesson in an online course.',
      difficulty: 'medium',
    },
    {
      title: 'Visit a Museum or Library',
      description: 'Spend time exploring a place of learning.',
      difficulty: 'medium',
    },
    {
      title: 'Write a Blog Post or Essay',
      description: "Write and publish something you've been thinking about.",
      difficulty: 'hard',
    },
  ],
  charisma: [
    {
      title: 'Attend a Social Event',
      description: 'Go to a meetup, party, or community gathering.',
      difficulty: 'hard',
    },
    {
      title: 'Reconnect with an Old Friend',
      description: "Reach out to someone you haven't talked to in months.",
      difficulty: 'medium',
    },
    {
      title: 'Organize a Hangout',
      description: 'Plan and host a get-together with friends.',
      difficulty: 'hard',
    },
    {
      title: 'Volunteer',
      description: 'Donate your time to help a cause you believe in.',
      difficulty: 'medium',
    },
  ],
  dexterity: [
    {
      title: 'Organize Your Workspace',
      description: 'Deep-clean and reorganize your entire work area.',
      difficulty: 'medium',
    },
    {
      title: 'Automate a Repetitive Task',
      description: 'Set up a tool or script to handle something you do often.',
      difficulty: 'hard',
    },
    {
      title: 'Complete a Side Project Milestone',
      description: 'Make meaningful progress on a personal project.',
      difficulty: 'hard',
    },
    {
      title: 'Unsubscribe from 10 Emails',
      description: 'Clean up your inbox subscriptions.',
      difficulty: 'easy',
    },
  ],
  willpower: [
    {
      title: '24-Hour Fast',
      description: 'Complete a 24-hour intermittent fast (with water).',
      difficulty: 'legendary',
    },
    {
      title: 'No Complaints Day',
      description: 'Go an entire day without complaining about anything.',
      difficulty: 'hard',
    },
    {
      title: 'Wake at 5am',
      description: 'Set an early alarm and get up immediately.',
      difficulty: 'hard',
    },
    {
      title: 'Apologize to Someone',
      description: "Make amends for something that's been weighing on you.",
      difficulty: 'medium',
    },
  ],
};

// ─── Boss Quest Templates ───

const BOSS_TEMPLATES: Record<StatName, Omit<QuestTemplate, 'stat' | 'type'>[]> = {
  strength: [
    {
      title: 'Couch to 5K',
      description: 'Follow a training program to run your first 5K.',
      difficulty: 'legendary',
      totalSteps: 8,
    },
    {
      title: '30-Day Fitness Challenge',
      description: 'Complete a structured workout program for 30 days.',
      difficulty: 'legendary',
      totalSteps: 30,
    },
    {
      title: 'Master a Movement',
      description: 'Learn to do a pull-up, handstand, or muscle-up.',
      difficulty: 'hard',
      totalSteps: 10,
    },
  ],
  vitality: [
    {
      title: 'Build a Sleep Routine',
      description: 'Establish consistent sleep/wake times for 2 weeks.',
      difficulty: 'hard',
      totalSteps: 14,
    },
    {
      title: 'Complete a Nutrition Overhaul',
      description: 'Gradually eliminate processed foods over 4 weeks.',
      difficulty: 'legendary',
      totalSteps: 4,
    },
    {
      title: 'Zero Sugar Month',
      description: 'Avoid added sugars for an entire month.',
      difficulty: 'legendary',
      totalSteps: 30,
    },
  ],
  intelligence: [
    {
      title: 'Read 5 Books',
      description: 'Complete 5 books in your area of interest.',
      difficulty: 'legendary',
      totalSteps: 5,
    },
    {
      title: 'Complete an Online Course',
      description: 'Finish all modules of an online course.',
      difficulty: 'hard',
      totalSteps: 8,
    },
    {
      title: 'Build a Portfolio Project',
      description: 'Create something that showcases your skills.',
      difficulty: 'legendary',
      totalSteps: 6,
    },
  ],
  charisma: [
    {
      title: 'Expand Your Circle',
      description: 'Meet and have meaningful conversations with 10 new people.',
      difficulty: 'legendary',
      totalSteps: 10,
    },
    {
      title: 'Public Speaking Journey',
      description: 'Give 5 presentations or speeches.',
      difficulty: 'legendary',
      totalSteps: 5,
    },
    {
      title: 'Mentorship Quest',
      description: 'Find a mentor or become one — have 8 meaningful sessions.',
      difficulty: 'hard',
      totalSteps: 8,
    },
  ],
  dexterity: [
    {
      title: 'GTD Mastery',
      description: 'Implement and maintain a Getting Things Done system for 3 weeks.',
      difficulty: 'hard',
      totalSteps: 21,
    },
    {
      title: 'Ship a Project',
      description: 'Take a project from idea to completion.',
      difficulty: 'legendary',
      totalSteps: 6,
    },
    {
      title: 'Declutter Your Life',
      description: 'Deep-clean and organize every room/area over 2 weeks.',
      difficulty: 'hard',
      totalSteps: 7,
    },
  ],
  willpower: [
    {
      title: '30-Day Meditation Streak',
      description: 'Meditate every single day for 30 days.',
      difficulty: 'legendary',
      totalSteps: 30,
    },
    {
      title: 'Break a Bad Habit',
      description: 'Identify and abstain from a bad habit for 21 days.',
      difficulty: 'legendary',
      totalSteps: 21,
    },
    {
      title: 'Stoic Week',
      description: 'Practice daily stoic exercises for 7 days.',
      difficulty: 'hard',
      totalSteps: 7,
    },
  ],
};

// ─── Public API ───

function scaleAll(templates: QuestTemplate[], gender?: Gender): QuestTemplate[] {
  if (!gender) return templates;
  return templates.map((t) => applyGenderScaling(t, gender));
}

export function getDailyTemplates(stat: StatName, gender?: Gender): QuestTemplate[] {
  return scaleAll(
    DAILY_TEMPLATES[stat].map((t) => ({ ...t, stat, type: 'daily' as const })),
    gender,
  );
}

export function getSideTemplates(stat?: StatName, gender?: Gender): QuestTemplate[] {
  if (stat) {
    return scaleAll(
      SIDE_TEMPLATES[stat].map((t) => ({ ...t, stat, type: 'side' as const })),
      gender,
    );
  }
  return scaleAll(
    Object.entries(SIDE_TEMPLATES).flatMap(([s, templates]) =>
      templates.map((t) => ({ ...t, stat: s as StatName, type: 'side' as const })),
    ),
    gender,
  );
}

export function getBossTemplates(stat?: StatName, gender?: Gender): QuestTemplate[] {
  if (stat) {
    return scaleAll(
      BOSS_TEMPLATES[stat].map((t) => ({ ...t, stat, type: 'boss' as const })),
      gender,
    );
  }
  return scaleAll(
    Object.entries(BOSS_TEMPLATES).flatMap(([s, templates]) =>
      templates.map((t) => ({ ...t, stat: s as StatName, type: 'boss' as const })),
    ),
    gender,
  );
}

export function getAllTemplates(
  type: QuestType,
  stat?: StatName,
  gender?: Gender,
): QuestTemplate[] {
  switch (type) {
    case 'daily':
      return stat
        ? getDailyTemplates(stat, gender)
        : Object.keys(DAILY_TEMPLATES).flatMap((s) => getDailyTemplates(s as StatName, gender));
    case 'side':
      return getSideTemplates(stat, gender);
    case 'boss':
      return getBossTemplates(stat, gender);
  }
}

/** Pick random templates for a stat, avoiding duplicates */
export function pickRandomTemplates(
  type: QuestType,
  stat: StatName,
  count: number,
  gender?: Gender,
): QuestTemplate[] {
  const all = getAllTemplates(type, stat, gender);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
