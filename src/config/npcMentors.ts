import { StatName } from '../types';

export interface StatMentor {
  stat: StatName;
  name: string;
  title: string;
  quotes: string[];
}

export const STAT_MENTORS: Record<StatName, StatMentor> = {
  strength: {
    stat: 'strength',
    name: 'Sergeant Kael',
    title: 'Drill Master',
    quotes: [
      'Show up. Sweat. Repeat. That is how iron becomes legend.',
      'Your body keeps score. Train it like you mean to win.',
      'One more rep than yesterday. That is the whole secret.',
    ],
  },
  vitality: {
    stat: 'vitality',
    name: 'Sister Maren',
    title: 'Keeper of the Sanctuary',
    quotes: [
      'Rest is not surrender. It is how campaigns are won.',
      'Guard your sleep as fiercely as you guard your honor.',
      'A healed hero returns stronger than a reckless one.',
    ],
  },
  intelligence: {
    stat: 'intelligence',
    name: 'Archivist Thalen',
    title: 'Master of Tomes',
    quotes: [
      'Curiosity without review is noise. Study with intent.',
      'Every page turned is a spell learned.',
      'Wisdom is earned in quiet hours, not loud boasts.',
    ],
  },
  charisma: {
    stat: 'charisma',
    name: 'Lyra the Emissary',
    title: 'Voice of the Banner',
    quotes: [
      'Leadership is showing up for others before they ask.',
      'Trust is built in small, honest moments.',
      'Your warmth can be someone else\'s turning point.',
    ],
  },
  dexterity: {
    stat: 'dexterity',
    name: 'Cipher Vex',
    title: 'Clockwork Tactician',
    quotes: [
      'Friction is the enemy. Simplify, then strike.',
      'Precision beats panic every time.',
      'Ship the next important thing. Momentum is sacred.',
    ],
  },
  willpower: {
    stat: 'willpower',
    name: 'Warden Solis',
    title: 'Trial Master',
    quotes: [
      'Do the hard thing while motivation is still asleep.',
      'Discipline is choosing your future self over comfort.',
      'Steady action outlasts fleeting inspiration.',
    ],
  },
};

export function getDailyMentorQuote(dominantStat: StatName, date = new Date()): {
  mentor: StatMentor;
  quote: string;
} {
  const mentor = STAT_MENTORS[dominantStat];
  const dayIndex = Math.floor(date.getTime() / 86_400_000) % mentor.quotes.length;
  return { mentor, quote: mentor.quotes[dayIndex] };
}
