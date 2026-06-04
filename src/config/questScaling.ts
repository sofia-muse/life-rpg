import { Gender } from '../types';
import { QuestTemplate } from './questTemplates';

interface QuestScaleRule {
  titlePattern: RegExp;
  maleValue: string;
  femaleValue: string;
}

const QUEST_SCALE_RULES: QuestScaleRule[] = [
  // Strength daily
  { titlePattern: /^20 Push-ups$/, maleValue: '20', femaleValue: '15' },
  { titlePattern: /^50 Squats$/, maleValue: '50', femaleValue: '35' },
  { titlePattern: /^Plank Challenge$/, maleValue: '2 minutes', femaleValue: '90 seconds' },
  // Strength side
  { titlePattern: /^Do 100 Push-ups/, maleValue: '100', femaleValue: '70' },
  // Boss — Master a Movement (same goals, no scaling needed)
];

export function applyGenderScaling(template: QuestTemplate, gender: Gender): QuestTemplate {
  if (gender === 'male') return template;

  for (const rule of QUEST_SCALE_RULES) {
    if (rule.titlePattern.test(template.title)) {
      return {
        ...template,
        title: template.title.replace(rule.maleValue, rule.femaleValue),
        description: template.description.replace(rule.maleValue, rule.femaleValue),
      };
    }
  }

  return template;
}
