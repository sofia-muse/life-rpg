import { StatName } from '../types';

export interface CampaignChapter {
  id: string;
  title: string;
  subtitle: string;
  dominantStats: StatName[];
  durationWeeks: number;
  /** Other heroes must reach this level before the chapter opens. Your own dominant-stat chapter stays open. */
  minHeroLevel: number;
  bossTemplateTitle: string;
  rewardTitle: string;
  narrative: string;
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: 'iron_awakening',
    title: 'The Iron Awakening',
    subtitle: 'Forge body and resolve',
    dominantStats: ['strength', 'willpower'],
    durationWeeks: 4,
    minHeroLevel: 1,
    bossTemplateTitle: '30-Day Fitness Challenge',
    rewardTitle: 'Iron Awakened',
    narrative: 'Your campaign begins where sweat meets discipline. Train boldly, finish what you start.',
  },
  {
    id: 'sanctuary_restoration',
    title: 'Restoration of the Sanctuary',
    subtitle: 'Heal, nourish, and recover',
    dominantStats: ['vitality', 'willpower'],
    durationWeeks: 4,
    minHeroLevel: 3,
    bossTemplateTitle: 'Build a Sleep Routine',
    rewardTitle: 'Sanctuary Restored',
    narrative: 'A long campaign needs a fortified sanctuary. Guard sleep, food, and calm.',
  },
  {
    id: 'scholars_pilgrimage',
    title: "The Scholar's Pilgrimage",
    subtitle: 'Learn, reflect, and master',
    dominantStats: ['intelligence', 'dexterity'],
    durationWeeks: 6,
    minHeroLevel: 5,
    bossTemplateTitle: 'Read 5 Books',
    rewardTitle: 'Pilgrim of Insight',
    narrative: 'Knowledge is the map. Precision is the compass. Walk both paths together.',
  },
  {
    id: 'banner_rising',
    title: 'Rising of the Banner',
    subtitle: 'Lead, connect, and inspire',
    dominantStats: ['charisma', 'vitality'],
    durationWeeks: 4,
    minHeroLevel: 8,
    bossTemplateTitle: 'Expand Your Circle',
    rewardTitle: 'Banner Bearer',
    narrative: 'Heroes are remembered by who they lift. Build trust through steady action.',
  },
  {
    id: 'clockwork_offensive',
    title: 'The Clockwork Offensive',
    subtitle: 'Ship, automate, and execute',
    dominantStats: ['dexterity', 'intelligence'],
    durationWeeks: 5,
    minHeroLevel: 12,
    bossTemplateTitle: 'Ship a Project',
    rewardTitle: 'Master Builder',
    narrative: 'Turn intention into output. Clear friction, then strike with precision.',
  },
  {
    id: 'trial_of_resolve',
    title: 'Trial of Resolve',
    subtitle: 'Discipline under pressure',
    dominantStats: ['willpower', 'strength'],
    durationWeeks: 4,
    minHeroLevel: 15,
    bossTemplateTitle: '30-Day Meditation Streak',
    rewardTitle: 'Warden of Resolve',
    narrative: 'When motivation fades, identity holds the line. Finish with honor.',
  },
];

export interface StatRegion {
  stat: StatName;
  label: string;
  icon: string;
  description: string;
}

export const STAT_REGIONS: StatRegion[] = [
  { stat: 'strength', label: 'Iron Highlands', icon: '⚔️', description: 'Training grounds of power and endurance.' },
  { stat: 'vitality', label: 'Sanctuary Groves', icon: '❤️', description: 'Wellsprings of rest and renewal.' },
  { stat: 'intelligence', label: 'Scholar\'s Spire', icon: '📚', description: 'Towers of study and reflection.' },
  { stat: 'charisma', label: 'Banner Fields', icon: '✨', description: 'Gathering halls of fellowship.' },
  { stat: 'dexterity', label: 'Clockwork Quarter', icon: '🏃', description: 'Workshops of precision and flow.' },
  { stat: 'willpower', label: 'Trial Peaks', icon: '🔥', description: 'High passes where resolve is forged.' },
];

export function getChapterForHero(dominantStat: StatName): CampaignChapter {
  const match = CAMPAIGN_CHAPTERS.find((chapter) => chapter.dominantStats.includes(dominantStat));
  return match ?? CAMPAIGN_CHAPTERS[0];
}

/** A hero's own dominant-stat chapter is always open. The rest wait on hero level. */
export function isChapterLocked(
  chapter: CampaignChapter,
  heroLevel: number,
  dominantStat: StatName,
): boolean {
  if (chapter.dominantStats.includes(dominantStat)) return false;
  return heroLevel < chapter.minHeroLevel;
}
