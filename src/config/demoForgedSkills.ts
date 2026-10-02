import { Skill, StatName } from '../types';
import { env } from './env';

/** Canned forged skills shown in demo mode so the Skills tab isn't an empty CTA. */
export const DEMO_FORGED_SKILLS: Skill[] = [
  {
    id: 'demo-forge-ember',
    name: 'Ember Discipline',
    description: 'A demo-forged craft that rewards morning training.',
    category: 'strength',
    requiredStat: 'strength',
    requiredLevel: 0,
    icon: '🔥',
    effect: '+5% XP on Strength quests',
    effects: [{ type: 'questXpBonus', percent: 5, stats: ['strength' as StatName] }],
  },
  {
    id: 'demo-forge-quill',
    name: 'Quill of Clarity',
    description: 'A demo-forged craft that sharpens study sessions.',
    category: 'intelligence',
    requiredStat: 'intelligence',
    requiredLevel: 0,
    icon: '🪶',
    effect: '+5% XP on Intelligence quests',
    effects: [{ type: 'questXpBonus', percent: 5, stats: ['intelligence' as StatName] }],
  },
];

export function getDemoForgedSkills(): Skill[] {
  return env.demoMode ? DEMO_FORGED_SKILLS : [];
}
