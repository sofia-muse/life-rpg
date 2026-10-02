import { QuestDifficulty, QuestType, Skill, SkillEffect, StatName } from '../types';

const questXpBonus = (
  percent: number,
  scope: {
    stats?: StatName[];
    questTypes?: QuestType[];
    appliesToAllQuests?: boolean;
  } = {},
): SkillEffect => ({
  type: 'questXpBonus',
  percent,
  ...scope,
});

const restDayXp = (stat: StatName, amount: number): SkillEffect => ({
  type: 'restDayXp',
  stat,
  amount,
});

const streakRetention = (retentionPercent: number): SkillEffect => ({
  type: 'streakRetention',
  retentionPercent,
});

const streakFreeze = (missesPerWeek: number): SkillEffect => ({
  type: 'streakFreeze',
  missesPerWeek,
});

const activeDailyQuestCapacity = (additionalSlots: number): SkillEffect => ({
  type: 'activeDailyQuestCapacity',
  additionalSlots,
});

const difficultyUnlock = (
  difficulty: QuestDifficulty,
  stats?: StatName[],
): SkillEffect => ({
  type: 'difficultyUnlock',
  difficulty,
  stats,
});

const bossStepXp = (percent: number): SkillEffect => ({
  type: 'bossStepXp',
  percent,
});

const weeklyCapacity = (additionalSlots: number): SkillEffect => ({
  type: 'weeklyCapacity',
  additionalSlots,
});

const displayText = (text: string): SkillEffect => ({
  type: 'displayText',
  text,
});

function formatQuestScope(effect: Extract<SkillEffect, { type: 'questXpBonus' }>): string {
  if (effect.appliesToAllQuests) {
    return 'ALL quests';
  }

  if (effect.questTypes?.length) {
    const labels = effect.questTypes.map((type) => `${type.charAt(0).toUpperCase()}${type.slice(1)} quests`);
    return labels.join(' and ');
  }

  if (effect.stats?.length) {
    const labels = effect.stats.map((stat) => stat.slice(0, 3).toUpperCase());
    if (labels.length === 1) {
      return `${labels[0]} quests`;
    }
    return `${labels.join(' and ')} quests`;
  }

  return 'quests';
}

function formatSkillEffect(effect: SkillEffect): string {
  switch (effect.type) {
    case 'displayText':
      return effect.text;
    case 'questXpBonus':
      return `+${effect.percent}% XP on ${formatQuestScope(effect)}`;
    case 'restDayXp':
      return `Rest days give +${effect.amount} ${effect.stat.charAt(0).toUpperCase()}${effect.stat.slice(1)} XP`;
    case 'streakRetention':
      return `Streak breaks keep ${effect.retentionPercent}% of your streak`;
    case 'streakFreeze':
      return `Streak freeze: ${effect.missesPerWeek} free miss per week`;
    case 'activeDailyQuestCapacity':
      return `Can have +${effect.additionalSlots} active daily quests`;
    case 'difficultyUnlock': {
      const label = effect.difficulty.charAt(0).toUpperCase() + effect.difficulty.slice(1);
      const stats = effect.stats?.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('/') ?? 'all';
      return `Unlock ${label} difficulty for ${stats} quests`;
    }
    case 'bossStepXp':
      return `+${effect.percent}% XP on boss quests`;
    case 'weeklyCapacity':
      return `+${effect.additionalSlots} weekly contract quest slots`;
  }
}

function buildSkill(skill: Omit<Skill, 'effect'> & { effect?: string }): Skill {
  return {
    ...skill,
    effect: skill.effect ?? skill.effects.map(formatSkillEffect).join(' · '),
  };
}

export const SKILLS: Skill[] = [
  // ─── Strength Skills (3) ───
  buildSkill({
    id: 'str-1',
    name: 'Iron Grip',
    description: 'Your dedication to physical training shows in every action.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 3,
    icon: '💪',
    effects: [questXpBonus(5, { stats: ['strength'] })],
  }),
  buildSkill({
    id: 'str-2',
    name: "Titan's Resolve",
    description: 'You push through barriers that would stop ordinary people.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 7,
    icon: '🏋️',
    effects: [difficultyUnlock('hard', ['strength'])],
  }),
  buildSkill({
    id: 'str-3',
    name: 'Colossus',
    description: 'Your physical prowess is legendary.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 15,
    icon: '⚔️',
    effects: [
      questXpBonus(10, { stats: ['strength', 'vitality', 'dexterity'] }),
      difficultyUnlock('legendary', ['strength']),
    ],
    effect: '+10% XP on all physical quests · Unlock Legendary Strength quests',
  }),
  buildSkill({
    id: 'str-4',
    name: 'Mountain Breaker',
    description: 'Even legendary burdens yield to your training.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 25,
    icon: '🏔️',
    effects: [questXpBonus(8, { questTypes: ['boss'] }), bossStepXp(10)],
  }),
  buildSkill({
    id: 'str-5',
    name: 'Worldshaper',
    description: 'Your strength reshapes what a day can hold.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 40,
    icon: '🌍',
    effects: [questXpBonus(12, { stats: ['strength'] }), weeklyCapacity(1)],
  }),

  // ─── Vitality Skills (3) ───
  buildSkill({
    id: 'vit-1',
    name: 'Second Wind',
    description: 'Rest and recovery come naturally to you.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 3,
    icon: '🌿',
    effects: [restDayXp('vitality', 15)],
  }),
  buildSkill({
    id: 'vit-2',
    name: 'Regeneration',
    description: 'Your body recovers faster than most.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 7,
    icon: '💚',
    effects: [streakRetention(50), difficultyUnlock('hard', ['vitality'])],
    effect: 'Streak breaks lose only 50% multiplier · Unlock Hard Vitality quests',
  }),
  buildSkill({
    id: 'vit-3',
    name: 'Undying',
    description: 'Nothing can keep you down for long.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 15,
    icon: '❤️‍🔥',
    effects: [questXpBonus(10, { stats: ['vitality'] }), difficultyUnlock('legendary', ['vitality'])],
    effect: '+10% XP on all health quests · Unlock Legendary Vitality quests',
  }),
  buildSkill({
    id: 'vit-4',
    name: 'Phoenix Recovery',
    description: 'Rest days become true restoration rites.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 25,
    icon: '🕊️',
    effects: [restDayXp('vitality', 35), streakFreeze(1)],
  }),
  buildSkill({
    id: 'vit-5',
    name: 'Eternal Vessel',
    description: 'Your recovery cadence carries the whole week.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 40,
    icon: '♾️',
    effects: [questXpBonus(12, { stats: ['vitality'] }), weeklyCapacity(1)],
  }),

  // ─── Intelligence Skills (3) ───
  buildSkill({
    id: 'int-1',
    name: 'Quick Study',
    description: 'You absorb knowledge faster than others.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 3,
    icon: '📖',
    effects: [questXpBonus(5, { stats: ['intelligence'] })],
  }),
  buildSkill({
    id: 'int-2',
    name: 'Polymath',
    description: 'Your intellectual breadth is remarkable.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 7,
    icon: '🧠',
    effects: [questXpBonus(10, { questTypes: ['side'] }), difficultyUnlock('hard', ['intelligence'])],
  }),
  buildSkill({
    id: 'int-3',
    name: 'Sage Mind',
    description: 'Wisdom beyond your years guides every decision.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 15,
    icon: '🔮',
    effects: [
      questXpBonus(10, { stats: ['intelligence'] }),
      difficultyUnlock('legendary', ['intelligence']),
    ],
    effect: '+10% XP on all learning quests · Unlock Legendary Intelligence quests',
  }),
  buildSkill({
    id: 'int-4',
    name: 'Archivist',
    description: 'Boss campaigns yield deeper insight with each step.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 25,
    icon: '📚',
    effects: [bossStepXp(15), questXpBonus(8, { questTypes: ['boss'] })],
  }),
  buildSkill({
    id: 'int-5',
    name: 'Oracle',
    description: 'Your mind opens room for more weekly vows.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 40,
    icon: '👁️',
    effects: [questXpBonus(12, { stats: ['intelligence'] }), weeklyCapacity(1)],
  }),

  // ─── Charisma Skills (3) ───
  buildSkill({
    id: 'cha-1',
    name: 'Silver Tongue',
    description: 'Your words carry weight and charm.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 3,
    icon: '💬',
    effects: [questXpBonus(5, { stats: ['charisma'] })],
  }),
  buildSkill({
    id: 'cha-2',
    name: 'Natural Leader',
    description: 'People naturally follow your example.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 7,
    icon: '👑',
    effects: [questXpBonus(10, { questTypes: ['boss'] }), difficultyUnlock('hard', ['charisma'])],
  }),
  buildSkill({
    id: 'cha-3',
    name: 'Legendary Presence',
    description: 'Your reputation precedes you wherever you go.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 15,
    icon: '✨',
    effects: [
      questXpBonus(10, { stats: ['charisma'] }),
      difficultyUnlock('legendary', ['charisma']),
    ],
    effect: '+10% XP on all social quests · Unlock Legendary Charisma quests',
  }),
  buildSkill({
    id: 'cha-4',
    name: 'Rallying Cry',
    description: 'Boss steps inspire extra growth for the party you lead.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 25,
    icon: '📣',
    effects: [bossStepXp(10), questXpBonus(8, { questTypes: ['boss'] })],
  }),
  buildSkill({
    id: 'cha-5',
    name: 'Beacon',
    description: 'Your presence expands what a week can hold.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 40,
    icon: '🗼',
    effects: [questXpBonus(12, { stats: ['charisma'] }), weeklyCapacity(1)],
  }),

  // ─── Dexterity Skills (3) ───
  buildSkill({
    id: 'dex-1',
    name: 'Swift Hands',
    description: 'You complete tasks with remarkable speed.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 3,
    icon: '⚡',
    effects: [questXpBonus(5, { stats: ['dexterity'] })],
  }),
  buildSkill({
    id: 'dex-2',
    name: 'Multitasker',
    description: 'Juggling multiple objectives is second nature.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 7,
    icon: '🎯',
    effects: [activeDailyQuestCapacity(2), difficultyUnlock('hard', ['dexterity'])],
  }),
  buildSkill({
    id: 'dex-3',
    name: 'Phantom Step',
    description: 'Your efficiency is almost supernatural.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 15,
    icon: '💨',
    effects: [
      questXpBonus(10, { stats: ['dexterity'] }),
      difficultyUnlock('legendary', ['dexterity']),
    ],
    effect: '+10% XP on all productivity quests · Unlock Legendary Dexterity quests',
  }),
  buildSkill({
    id: 'dex-4',
    name: 'Clockwork',
    description: 'Daily capacity expands as your craft sharpens.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 25,
    icon: '⚙️',
    effects: [activeDailyQuestCapacity(2), questXpBonus(8, { stats: ['dexterity'] })],
  }),
  buildSkill({
    id: 'dex-5',
    name: 'Warp Weaver',
    description: 'You braid more vows into each week.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 40,
    icon: '🧵',
    effects: [questXpBonus(12, { stats: ['dexterity'] }), weeklyCapacity(1)],
  }),

  // ─── Willpower Skills (3) ───
  buildSkill({
    id: 'wil-1',
    name: 'Iron Will',
    description: 'Discipline is your greatest weapon.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 3,
    icon: '🔥',
    effects: [questXpBonus(5, { stats: ['willpower'] })],
  }),
  buildSkill({
    id: 'wil-2',
    name: 'Unbreakable',
    description: 'Your streak resilience is legendary.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 7,
    icon: '🛡️',
    effects: [streakFreeze(1), difficultyUnlock('hard', ['willpower'])],
  }),
  buildSkill({
    id: 'wil-3',
    name: 'Ascendant Will',
    description: 'Your determination knows no bounds.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 15,
    icon: '⭐',
    effects: [
      questXpBonus(10, { stats: ['willpower'] }),
      difficultyUnlock('legendary', ['willpower']),
    ],
    effect: '+10% XP on all discipline quests · Unlock Legendary Willpower quests',
  }),
  buildSkill({
    id: 'wil-4',
    name: 'Stoic Anchor',
    description: 'Misses barely dent the chain you forged.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 25,
    icon: '⚓',
    effects: [streakRetention(75), streakFreeze(2)],
  }),
  buildSkill({
    id: 'wil-5',
    name: 'Unyielding Crown',
    description: 'Your discipline expands the week itself.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 40,
    icon: '👑',
    effects: [questXpBonus(12, { stats: ['willpower'] }), weeklyCapacity(1)],
  }),

  // ─── Cross-Stat Skills (6) ───
  buildSkill({
    id: 'cross-1',
    name: 'Battle Mage',
    description: 'Strength of body and mind combined.',
    category: 'cross',
    requiredStat: 'strength',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '⚡🧠',
    effects: [questXpBonus(5, { stats: ['strength', 'intelligence'] })],
  }),
  buildSkill({
    id: 'cross-2',
    name: 'Warrior Poet',
    description: 'Physical prowess meets artistic expression.',
    category: 'cross',
    requiredStat: 'strength',
    requiredLevel: 5,
    secondaryStat: 'charisma',
    secondaryLevel: 5,
    icon: '⚔️✨',
    effects: [questXpBonus(5, { stats: ['strength', 'charisma'] })],
  }),
  buildSkill({
    id: 'cross-3',
    name: 'Mind Body',
    description: 'Perfect harmony of physical and mental discipline.',
    category: 'cross',
    requiredStat: 'vitality',
    requiredLevel: 5,
    secondaryStat: 'willpower',
    secondaryLevel: 5,
    icon: '🧘',
    effects: [questXpBonus(5, { stats: ['vitality', 'willpower'] })],
  }),
  buildSkill({
    id: 'cross-4',
    name: 'Tactician',
    description: 'Speed meets strategy in perfect execution.',
    category: 'cross',
    requiredStat: 'dexterity',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '🎯📚',
    effects: [questXpBonus(5, { stats: ['dexterity', 'intelligence'] })],
  }),
  buildSkill({
    id: 'cross-5',
    name: 'Diplomat',
    description: 'Knowledge and charm make a powerful combination.',
    category: 'cross',
    requiredStat: 'charisma',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '🤝📖',
    effects: [questXpBonus(5, { stats: ['charisma', 'intelligence'] })],
  }),
  buildSkill({
    id: 'cross-6',
    name: 'Zen Master',
    description: 'Ultimate balance of all aspects of life.',
    category: 'cross',
    requiredStat: 'willpower',
    requiredLevel: 10,
    secondaryStat: 'vitality',
    secondaryLevel: 10,
    icon: '☯️',
    effects: [questXpBonus(3, { appliesToAllQuests: true })],
  }),
];

// AI-forged skills are dynamic (per hero). They're registered here at runtime so the rest of the
// skill system (lookup, XP-bonus resolution) treats them uniformly with the static catalog.
let forgedSkills: Skill[] = [];

function normalizeForgedSkill(skill: Skill): Skill {
  if (skill.effects?.length > 0) {
    return skill;
  }

  const percent = Number.parseInt(skill.effect.match(/\+(\d+)%/)?.[1] ?? '0', 10);
  return {
    ...skill,
    effects:
      percent > 0 && skill.requiredStat
        ? [questXpBonus(percent, { stats: [skill.requiredStat] })]
        : [displayText(skill.effect)],
  };
}

export function registerForgedSkills(skills: Skill[]): void {
  forgedSkills = skills.map(normalizeForgedSkill);
}

export function getForgedSkills(): Skill[] {
  return forgedSkills;
}

export function getSkillsByCategory(category: string): Skill[] {
  return SKILLS.filter((s) => s.category === category);
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id) ?? forgedSkills.find((s) => s.id === id);
}
