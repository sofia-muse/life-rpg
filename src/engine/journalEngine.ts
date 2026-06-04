import { StatName, Quest, STAT_ICONS } from '../types';

// Narrative templates for quest completions
const QUEST_NARRATIVES: Record<StatName, string[]> = {
  strength: [
    'The hero tested their might with "{quest}" and emerged stronger.',
    'Through sweat and determination, "{quest}" was conquered.',
    'Iron will met iron weights — "{quest}" complete.',
  ],
  vitality: [
    'Nurturing body and soul, the hero completed "{quest}".',
    'The path to wellness continued as "{quest}" was fulfilled.',
    'Life force renewed — "{quest}" achieved with grace.',
  ],
  intelligence: [
    'Knowledge grew as the hero pursued "{quest}".',
    'The mind expanded through the challenge of "{quest}".',
    'Wisdom earned — "{quest}" added to the hero\'s repertoire.',
  ],
  charisma: [
    'Hearts were won as the hero completed "{quest}".',
    'With charm and grace, "{quest}" was a resounding success.',
    'The hero\'s influence grew through "{quest}".',
  ],
  dexterity: [
    'Swift and sure, the hero dispatched "{quest}" with ease.',
    'Efficiency personified — "{quest}" completed ahead of schedule.',
    'Another task falls to the hero\'s agile hands: "{quest}".',
  ],
  willpower: [
    'Inner strength prevailed as "{quest}" was mastered.',
    'Discipline forged in fire — "{quest}" complete.',
    'The mind\'s fortress held strong through "{quest}".',
  ],
};

// Generate narrative for a completed quest
export function generateQuestNarrative(quest: Quest): string {
  const templates = QUEST_NARRATIVES[quest.stat];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{quest}', quest.title);
}

// Generate daily summary narrative
export function generateDailySummary(
  questsCompleted: Quest[],
  xpGained: Record<StatName, number>,
  levelsGained: StatName[],
  skillsUnlocked: string[],
  streakDays: number,
): string {
  const parts: string[] = [];

  // Opening
  if (questsCompleted.length === 0) {
    parts.push("A quiet day in the hero's journey. Rest can be its own reward.");
  } else if (questsCompleted.length <= 2) {
    parts.push('The hero ventured forth and faced their challenges:');
  } else {
    parts.push('A mighty day of adventure! The hero conquered many challenges:');
  }

  // Quest narratives
  for (const quest of questsCompleted) {
    parts.push(`\n${STAT_ICONS[quest.stat]} ${generateQuestNarrative(quest)}`);
  }

  // XP summary
  const totalXP = Object.values(xpGained).reduce((a, b) => a + b, 0);
  if (totalXP > 0) {
    parts.push(`\nTotal experience gained: ${totalXP} XP`);
  }

  // Level ups
  for (const stat of levelsGained) {
    parts.push(
      `\n🎉 ${STAT_ICONS[stat]} ${stat.charAt(0).toUpperCase() + stat.slice(1)} leveled up!`,
    );
  }

  // Skills
  if (skillsUnlocked.length > 0) {
    parts.push(
      `\n✨ ${skillsUnlocked.length} new skill${skillsUnlocked.length > 1 ? 's' : ''} unlocked!`,
    );
  }

  // Streak
  if (streakDays > 0) {
    parts.push(`\n🔥 Adventure streak: ${streakDays} day${streakDays > 1 ? 's' : ''}`);
  }

  return parts.join('');
}

// Generate milestone narrative
export function generateMilestoneNarrative(milestone: string): string {
  return `⭐ A new milestone reached: ${milestone}`;
}
