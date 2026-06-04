import { ClassDefinition, ClassTier, Gender, StatName } from '../types';

// Class names by dominant stat and tier
const CLASS_MAP: Record<
  StatName,
  Record<ClassTier, { name: string; title: string; description: string }>
> = {
  strength: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Warrior',
      description: 'A fledgling fighter beginning their journey.',
    },
    2: {
      name: 'Warrior',
      title: 'Warrior',
      description: 'A seasoned fighter who has proven their mettle.',
    },
    3: {
      name: 'Champion',
      title: 'Champion of Iron',
      description: 'A formidable champion whose strength is renowned.',
    },
    4: {
      name: 'Warlord',
      title: 'Warlord',
      description: 'A legendary warrior who commands respect through sheer power.',
    },
    5: { name: 'Titan', title: 'Titan of Legends', description: 'An unstoppable force of nature.' },
  },
  vitality: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Healer',
      description: 'A budding healer learning the ways of wellness.',
    },
    2: { name: 'Druid', title: 'Druid', description: 'A guardian of health and natural balance.' },
    3: {
      name: 'Sage Healer',
      title: 'Sage Healer',
      description: 'A wise healer whose vitality inspires others.',
    },
    4: {
      name: 'Archdruid',
      title: 'Archdruid',
      description: 'Master of life force and restoration.',
    },
    5: {
      name: 'Immortal',
      title: 'The Immortal',
      description: 'Transcendent vitality beyond mortal limits.',
    },
  },
  intelligence: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Scholar',
      description: 'A curious mind seeking knowledge.',
    },
    2: {
      name: 'Scholar',
      title: 'Scholar',
      description: 'A dedicated student who has mastered the basics.',
    },
    3: {
      name: 'Archmage',
      title: 'Archmage',
      description: 'A brilliant mind whose knowledge runs deep.',
    },
    4: { name: 'Sage', title: 'Grand Sage', description: 'A font of wisdom respected by all.' },
    5: {
      name: 'Oracle',
      title: 'The Oracle',
      description: 'Omniscient understanding of all disciplines.',
    },
  },
  charisma: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Bard',
      description: 'A charming newcomer finding their voice.',
    },
    2: { name: 'Bard', title: 'Bard', description: 'A charismatic storyteller who wins hearts.' },
    3: {
      name: 'Enchanter',
      title: 'Enchanter',
      description: 'A magnetic presence that draws people in.',
    },
    4: {
      name: 'Sovereign',
      title: 'Sovereign',
      description: 'A natural ruler whose charisma is legendary.',
    },
    5: {
      name: 'Paragon',
      title: 'The Paragon',
      description: 'Embodiment of leadership and inspiration.',
    },
  },
  dexterity: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Rogue',
      description: 'A nimble beginner honing their reflexes.',
    },
    2: { name: 'Rogue', title: 'Rogue', description: 'A swift operative who gets things done.' },
    3: {
      name: 'Assassin',
      title: 'Shadow Assassin',
      description: 'A master of speed and precision.',
    },
    4: { name: 'Phantom', title: 'Phantom', description: 'Moving with supernatural efficiency.' },
    5: {
      name: 'Chronos',
      title: 'Chronos',
      description: 'Time itself bends to your productivity.',
    },
  },
  willpower: {
    1: {
      name: 'Apprentice',
      title: 'Apprentice Monk',
      description: 'A disciplined soul beginning their training.',
    },
    2: { name: 'Monk', title: 'Monk', description: 'A disciplined practitioner of iron will.' },
    3: { name: 'Paladin', title: 'Paladin', description: 'An unbreakable champion of discipline.' },
    4: { name: 'Ascendant', title: 'Ascendant', description: 'Transcending ordinary willpower.' },
    5: {
      name: 'Transcendent',
      title: 'The Transcendent',
      description: 'Will beyond mortal comprehension.',
    },
  },
};

// Tier requirements (hero level)
const TIER_LEVELS: Record<ClassTier, number> = {
  1: 1,
  2: 5,
  3: 15,
  4: 30,
  5: 50,
};

export function getClassDefinition(dominantStat: StatName, tier: ClassTier): ClassDefinition {
  const classDef = CLASS_MAP[dominantStat][tier];
  return {
    tier,
    name: classDef.name,
    dominantStat,
    requiredLevel: TIER_LEVELS[tier],
    title: classDef.title,
    description: classDef.description,
  };
}

export function getTierForLevel(heroLevel: number): ClassTier {
  if (heroLevel >= 50) return 5;
  if (heroLevel >= 30) return 4;
  if (heroLevel >= 15) return 3;
  if (heroLevel >= 5) return 2;
  return 1;
}

export function getClassName(dominantStat: StatName, tier: ClassTier): string {
  return CLASS_MAP[dominantStat][tier].title;
}

export function getStarterQuests(
  focusStats: StatName[],
  gender?: Gender,
): { title: string; stat: StatName; description: string }[] {
  const isFemale = gender === 'female';
  const questTemplates: Record<StatName, { title: string; description: string }[]> = {
    strength: [
      {
        title: isFemale ? '15 Push-ups' : '20 Push-ups',
        description: isFemale
          ? 'Complete 15 push-ups to start building strength.'
          : 'Complete 20 push-ups to start building strength.',
      },
      { title: '30-min Workout', description: 'Complete a 30-minute workout session.' },
    ],
    vitality: [
      { title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day.' },
      { title: '7+ Hours Sleep', description: 'Get a full night of quality sleep.' },
    ],
    intelligence: [
      { title: 'Read for 30 Minutes', description: 'Read a book or educational article.' },
      { title: 'Learn Something New', description: 'Watch a tutorial or take a lesson.' },
    ],
    charisma: [
      { title: 'Reach Out to a Friend', description: 'Send a meaningful message to someone.' },
      {
        title: 'Practice Active Listening',
        description: 'Have a focused conversation without distractions.',
      },
    ],
    dexterity: [
      {
        title: 'Complete Top 3 Tasks',
        description: 'Finish your three most important tasks today.',
      },
      { title: 'No Phone for 1 Hour', description: 'Put your phone away and focus deeply.' },
    ],
    willpower: [
      { title: 'Meditate for 10 Minutes', description: 'Practice mindfulness meditation.' },
      { title: 'Cold Shower', description: 'Take a cold shower to build mental toughness.' },
    ],
  };

  return focusStats.flatMap((stat) => questTemplates[stat].map((q) => ({ ...q, stat })));
}
