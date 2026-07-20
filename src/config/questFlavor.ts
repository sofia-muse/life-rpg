import { Quest, QuestDifficulty, StatName } from '../types';

const FLAVOR_BY_STAT: Record<StatName, string[]> = {
  strength: [
    'Trial of the Iron Gate',
    'The Forge Vigil',
    'Crucible of Might',
    'Anvil Rite',
    'Warrior\'s Oath',
  ],
  vitality: [
    'Sanctuary Renewal',
    'Wellspring Vigil',
    'Restoration Rite',
    'Garden of Vitality',
    'Healer\'s Covenant',
  ],
  intelligence: [
    'Scholar\'s Circuit',
    'Tome of Insight',
    'Mindforge Trial',
    'Archivist\'s Quest',
    'Wisdom Gate',
  ],
  charisma: [
    'Banner of Fellowship',
    'Heartstone Gathering',
    'Council of Voices',
    'Beacon of Trust',
    'Emissary\'s Errand',
  ],
  dexterity: [
    'Clockwork Offensive',
    'Swiftblade Errand',
    'Precision Trial',
    'Flow State Rite',
    'Artisan\'s Sprint',
  ],
  willpower: [
    'Trial of Resolve',
    'Stillness Vigil',
    'Discipline Gate',
    'Fortress of Mind',
    'Oath of Endurance',
  ],
};

const DIFFICULTY_SUFFIX: Record<QuestDifficulty, string> = {
  easy: ' — Scout',
  medium: ' — Vanguard',
  hard: ' — Champion',
  legendary: ' — Mythic',
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getQuestFlavorTitle(quest: Pick<Quest, 'title' | 'stat' | 'difficulty' | 'type'>): string {
  const pool = FLAVOR_BY_STAT[quest.stat];
  const index = hashString(quest.title) % pool.length;
  const base = pool[index];
  return `${base}${DIFFICULTY_SUFFIX[quest.difficulty]}`;
}

export function getQuestFlavorDescription(
  quest: Pick<Quest, 'title' | 'description' | 'stat' | 'type'>,
): string {
  const statLabel = quest.stat.charAt(0).toUpperCase() + quest.stat.slice(1);
  if (quest.type === 'boss') {
    return `A multi-phase campaign testing your ${statLabel}. ${quest.description}`;
  }
  if (quest.type === 'side') {
    return `A one-time side venture for ${statLabel}. ${quest.description}`;
  }
  return `A daily rite of ${statLabel}. ${quest.description}`;
}

export function getQuestDisplayTitle(
  quest: Pick<Quest, 'title' | 'stat' | 'difficulty' | 'type'>,
  useFantasy: boolean,
): string {
  return useFantasy ? getQuestFlavorTitle(quest) : quest.title;
}

export function getQuestDisplayDescription(
  quest: Pick<Quest, 'title' | 'description' | 'stat' | 'type'>,
  useFantasy: boolean,
): string {
  return useFantasy ? getQuestFlavorDescription(quest) : quest.description;
}
