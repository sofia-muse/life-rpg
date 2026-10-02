import { StatName } from '../types';
import { QuestSuggestionPackDto } from '../api/guidanceApi';
import { getDailyTemplates, getSideTemplates, QuestTemplate } from './questTemplates';

const WHY_BY_STAT: Record<StatName, string> = {
  strength: 'Keeps your power path warm — short, clear physical reps.',
  vitality: 'Restores the body so streaks and rest days stay sustainable.',
  intelligence: 'Sharpens focus for study streaks and boss planning.',
  charisma: 'Builds social momentum that weekly contracts reward.',
  dexterity: 'Protects daily throughput with small, finishable chores.',
  willpower: 'Trains discipline — the spine of every long streak.',
};

function toSuggestion(template: QuestTemplate, whyItFits: string) {
  return {
    title: template.title,
    description: template.description,
    type: template.type,
    difficulty: template.difficulty,
    stat: template.stat,
    whyItFits,
    totalSteps: template.totalSteps ?? null,
  };
}

/**
 * Offline Guildmaster pack for demo mode — mirrors live guidance shape without Gemini.
 */
export function getDemoQuestSuggestionPack(dominantStat: StatName = 'strength'): QuestSuggestionPackDto {
  const dailies = getDailyTemplates(dominantStat).slice(0, 3);
  const sides = getSideTemplates(dominantStat).slice(0, 2);
  const suggestions = [...dailies, ...sides].map((template) =>
    toSuggestion(template, WHY_BY_STAT[template.stat] ?? WHY_BY_STAT.strength),
  );

  return {
    contractTitle: `Demo guidance · ${dominantStat.charAt(0).toUpperCase()}${dominantStat.slice(1)} focus`,
    suggestions,
  };
}

export function demoSuggestionToTemplate(
  suggestion: QuestSuggestionPackDto['suggestions'][number],
): QuestTemplate {
  return {
    title: suggestion.title,
    description: suggestion.description,
    type: suggestion.type,
    difficulty: suggestion.difficulty,
    stat: suggestion.stat,
    totalSteps: suggestion.totalSteps ?? undefined,
  };
}
