import { Skill } from '../types';

export const SKILLS: Skill[] = [
  // ─── Strength Skills (3) ───
  {
    id: 'str-1',
    name: 'Iron Grip',
    description: 'Your dedication to physical training shows in every action.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 3,
    icon: '💪',
    effect: '+5% XP on Strength quests',
  },
  {
    id: 'str-2',
    name: "Titan's Resolve",
    description: 'You push through barriers that would stop ordinary people.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 7,
    icon: '🏋️',
    effect: 'Unlock Hard difficulty Strength quests',
  },
  {
    id: 'str-3',
    name: 'Colossus',
    description: 'Your physical prowess is legendary.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 15,
    icon: '⚔️',
    effect: '+10% XP on all physical quests',
  },

  // ─── Vitality Skills (3) ───
  {
    id: 'vit-1',
    name: 'Second Wind',
    description: 'Rest and recovery come naturally to you.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 3,
    icon: '🌿',
    effect: 'Rest days give +15 Vitality XP',
  },
  {
    id: 'vit-2',
    name: 'Regeneration',
    description: 'Your body recovers faster than most.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 7,
    icon: '💚',
    effect: 'Streak breaks lose only 50% multiplier',
  },
  {
    id: 'vit-3',
    name: 'Undying',
    description: 'Nothing can keep you down for long.',
    category: 'vitality',
    requiredStat: 'vitality',
    requiredLevel: 15,
    icon: '❤️‍🔥',
    effect: '+10% XP on all health quests',
  },

  // ─── Intelligence Skills (3) ───
  {
    id: 'int-1',
    name: 'Quick Study',
    description: 'You absorb knowledge faster than others.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 3,
    icon: '📖',
    effect: '+5% XP on Intelligence quests',
  },
  {
    id: 'int-2',
    name: 'Polymath',
    description: 'Your intellectual breadth is remarkable.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 7,
    icon: '🧠',
    effect: 'Side quests give +10% XP',
  },
  {
    id: 'int-3',
    name: 'Sage Mind',
    description: 'Wisdom beyond your years guides every decision.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 15,
    icon: '🔮',
    effect: '+10% XP on all learning quests',
  },

  // ─── Charisma Skills (3) ───
  {
    id: 'cha-1',
    name: 'Silver Tongue',
    description: 'Your words carry weight and charm.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 3,
    icon: '💬',
    effect: '+5% XP on Charisma quests',
  },
  {
    id: 'cha-2',
    name: 'Natural Leader',
    description: 'People naturally follow your example.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 7,
    icon: '👑',
    effect: 'Boss quests give +10% XP',
  },
  {
    id: 'cha-3',
    name: 'Legendary Presence',
    description: 'Your reputation precedes you wherever you go.',
    category: 'charisma',
    requiredStat: 'charisma',
    requiredLevel: 15,
    icon: '✨',
    effect: '+10% XP on all social quests',
  },

  // ─── Dexterity Skills (3) ───
  {
    id: 'dex-1',
    name: 'Swift Hands',
    description: 'You complete tasks with remarkable speed.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 3,
    icon: '⚡',
    effect: '+5% XP on Dexterity quests',
  },
  {
    id: 'dex-2',
    name: 'Multitasker',
    description: 'Juggling multiple objectives is second nature.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 7,
    icon: '🎯',
    effect: 'Can have +2 active daily quests',
  },
  {
    id: 'dex-3',
    name: 'Phantom Step',
    description: 'Your efficiency is almost supernatural.',
    category: 'dexterity',
    requiredStat: 'dexterity',
    requiredLevel: 15,
    icon: '💨',
    effect: '+10% XP on all productivity quests',
  },

  // ─── Willpower Skills (3) ───
  {
    id: 'wil-1',
    name: 'Iron Will',
    description: 'Discipline is your greatest weapon.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 3,
    icon: '🔥',
    effect: '+5% XP on Willpower quests',
  },
  {
    id: 'wil-2',
    name: 'Unbreakable',
    description: 'Your streak resilience is legendary.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 7,
    icon: '🛡️',
    effect: 'Streak freeze: 1 free miss per week',
  },
  {
    id: 'wil-3',
    name: 'Ascendant Will',
    description: 'Your determination knows no bounds.',
    category: 'willpower',
    requiredStat: 'willpower',
    requiredLevel: 15,
    icon: '⭐',
    effect: '+10% XP on all discipline quests',
  },

  // ─── Cross-Stat Skills (6) ───
  {
    id: 'cross-1',
    name: 'Battle Mage',
    description: 'Strength of body and mind combined.',
    category: 'cross',
    requiredStat: 'strength',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '⚡🧠',
    effect: '+5% XP on STR and INT quests',
  },
  {
    id: 'cross-2',
    name: 'Warrior Poet',
    description: 'Physical prowess meets artistic expression.',
    category: 'cross',
    requiredStat: 'strength',
    requiredLevel: 5,
    secondaryStat: 'charisma',
    secondaryLevel: 5,
    icon: '⚔️✨',
    effect: '+5% XP on STR and CHA quests',
  },
  {
    id: 'cross-3',
    name: 'Mind Body',
    description: 'Perfect harmony of physical and mental discipline.',
    category: 'cross',
    requiredStat: 'vitality',
    requiredLevel: 5,
    secondaryStat: 'willpower',
    secondaryLevel: 5,
    icon: '🧘',
    effect: '+5% XP on VIT and WIL quests',
  },
  {
    id: 'cross-4',
    name: 'Tactician',
    description: 'Speed meets strategy in perfect execution.',
    category: 'cross',
    requiredStat: 'dexterity',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '🎯📚',
    effect: '+5% XP on DEX and INT quests',
  },
  {
    id: 'cross-5',
    name: 'Diplomat',
    description: 'Knowledge and charm make a powerful combination.',
    category: 'cross',
    requiredStat: 'charisma',
    requiredLevel: 5,
    secondaryStat: 'intelligence',
    secondaryLevel: 5,
    icon: '🤝📖',
    effect: '+5% XP on CHA and INT quests',
  },
  {
    id: 'cross-6',
    name: 'Zen Master',
    description: 'Ultimate balance of all aspects of life.',
    category: 'cross',
    requiredStat: 'willpower',
    requiredLevel: 10,
    secondaryStat: 'vitality',
    secondaryLevel: 10,
    icon: '☯️',
    effect: '+3% XP on ALL quests',
  },
];

// AI-forged skills are dynamic (per hero). They're registered here at runtime so the rest of the
// skill system (lookup, XP-bonus resolution) treats them uniformly with the static catalog.
let forgedSkills: Skill[] = [];

export function registerForgedSkills(skills: Skill[]): void {
  forgedSkills = skills;
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
