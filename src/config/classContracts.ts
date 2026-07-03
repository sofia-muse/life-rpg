import { Hero, Quest, StatName } from '../types';
import {
  QuestTemplate,
  getBossTemplates,
  getDailyTemplates,
  getSideTemplates,
} from './questTemplates';

interface ContractBlueprint {
  codename: string;
  focus: string;
  vow: string;
  summary: string;
  dailyTitles: string[];
  sideTitles: string[];
  bossTitles: string[];
}

export interface ClassContract {
  id: string;
  title: string;
  focus: string;
  vow: string;
  summary: string;
  requiredCount: number;
  activeMatches: number;
  completedMatches: number;
  recommended: QuestTemplate[];
}

const CONTRACT_BLUEPRINTS: Record<StatName, ContractBlueprint> = {
  strength: {
    codename: 'Forge of Iron',
    focus: 'power, movement, and deliberate recovery',
    vow: 'Train with intent. Recover with discipline. Finish what your body begins.',
    summary: 'Physical quests should feel like a training block, not random chores.',
    dailyTitles: ['20 Push-ups', '30-min Workout', 'Plank Challenge'],
    sideTitles: ['Run a 5K', 'Do 100 Push-ups in a Day'],
    bossTitles: ['Couch to 5K', '30-Day Fitness Challenge'],
  },
  vitality: {
    codename: 'Sanctuary of Renewal',
    focus: 'sleep, nourishment, and restoration',
    vow: 'Guard your energy. Protect your sleep. Build resilience through care.',
    summary: 'Recovery should feel like maintenance for a long campaign, not a guilty afterthought.',
    dailyTitles: ['Drink 8 Glasses of Water', '7+ Hours Sleep', 'Screen-Free Before Bed'],
    sideTitles: ['Cook a New Recipe', 'Meal Prep Sunday'],
    bossTitles: ['Build a Sleep Routine', 'Complete a Nutrition Overhaul'],
  },
  intelligence: {
    codename: "Scholar's Circuit",
    focus: 'deep work, learning, and reflection',
    vow: 'Study with focus. Review with honesty. Turn curiosity into mastery.',
    summary: 'Learning quests should read like a study path that grows sharper over time.',
    dailyTitles: ['Read for 30 Minutes', 'Learn Something New', 'Review Your Notes'],
    sideTitles: ['Finish a Book', 'Take an Online Course Lesson'],
    bossTitles: ['Read 5 Books', 'Complete an Online Course'],
  },
  charisma: {
    codename: 'Banner of Fellowship',
    focus: 'connection, leadership, and generosity',
    vow: 'Reach outward. Lead with warmth. Make your presence useful to others.',
    summary: 'Social growth should feel like building influence, trust, and support.',
    dailyTitles: ['Reach Out to a Friend', 'Practice Active Listening', 'Help Someone'],
    sideTitles: ['Reconnect with an Old Friend', 'Volunteer'],
    bossTitles: ['Expand Your Circle', 'Mentorship Quest'],
  },
  dexterity: {
    codename: 'Clockwork Offensive',
    focus: 'systems, execution, and clean focus',
    vow: 'Move with precision. Reduce friction. Ship the next important thing.',
    summary: 'Productivity quests should feel like a tactical operations board for real life.',
    dailyTitles: ['Complete Top 3 Tasks', 'Single-Task for 45 Minutes', 'Plan Tomorrow Tonight'],
    sideTitles: ['Automate a Repetitive Task', 'Complete a Side Project Milestone'],
    bossTitles: ['GTD Mastery', 'Ship a Project'],
  },
  willpower: {
    codename: 'Trial of Resolve',
    focus: 'discipline, restraint, and calm under pressure',
    vow: 'Do the hard thing early. Stay steady when motivation fades. Finish with honor.',
    summary: 'Discipline quests should feel like rites that harden identity, not punishment.',
    dailyTitles: ['Meditate for 10 Minutes', 'Do the Hard Thing First', 'Gratitude List'],
    sideTitles: ['No Complaints Day', 'Apologize to Someone'],
    bossTitles: ['30-Day Meditation Streak', 'Break a Bad Habit'],
  },
};

function pickPreferredTemplates(templates: QuestTemplate[], preferredTitles: string[], count: number) {
  const preferred = preferredTitles
    .map((title) => templates.find((template) => template.title === title))
    .filter((template): template is QuestTemplate => !!template);

  const fallback = templates.filter(
    (template) => !preferred.some((selected) => selected.title === template.title),
  );

  return [...preferred, ...fallback].slice(0, count);
}

function countContractMatches(quests: Quest[], titles: Set<string>, completedOnly: boolean) {
  return quests.filter((quest) => {
    if (!titles.has(quest.title)) return false;
    return completedOnly ? quest.isCompleted : quest.isActive && !quest.isCompleted;
  }).length;
}

export function getClassContract(hero: Hero, quests: Quest[] = []): ClassContract {
  const blueprint = CONTRACT_BLUEPRINTS[hero.dominantStat];
  const gender = hero.characterAppearance?.gender;

  const recommended = [
    ...pickPreferredTemplates(getDailyTemplates(hero.dominantStat, gender), blueprint.dailyTitles, 2),
    ...pickPreferredTemplates(getSideTemplates(hero.dominantStat, gender), blueprint.sideTitles, 1),
    ...pickPreferredTemplates(getBossTemplates(hero.dominantStat, gender), blueprint.bossTitles, 1),
  ];

  const recommendedTitles = new Set(recommended.map((template) => template.title));

  return {
    id: `${hero.dominantStat}-contract`,
    title: blueprint.codename,
    focus: blueprint.focus,
    vow: blueprint.vow,
    summary: `${hero.className} heroes thrive when their week reinforces ${blueprint.focus}. ${blueprint.summary}`,
    requiredCount: 3,
    activeMatches: countContractMatches(quests, recommendedTitles, false),
    completedMatches: countContractMatches(quests, recommendedTitles, true),
    recommended,
  };
}
