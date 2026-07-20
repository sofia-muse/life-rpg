import { StatName } from '../types';

/** Zeroed six-stat block — shared by stores that build XP / journal deltas. */
export function emptyStatBlock(): Record<StatName, number> {
  return {
    strength: 0,
    vitality: 0,
    intelligence: 0,
    charisma: 0,
    dexterity: 0,
    willpower: 0,
  };
}
