import { StatName } from '../types';

export interface QuizAnswer {
  text: string;
  weights: Partial<Record<StatName, number>>;
}

export interface QuizQuestion {
  scenario: string;
  answers: QuizAnswer[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    scenario: "It's Saturday morning with no plans. What sounds most appealing?",
    answers: [
      { text: 'Hit the gym or go for a long run', weights: { strength: 3, vitality: 1 } },
      {
        text: 'Cook a nice breakfast and go for a nature walk',
        weights: { vitality: 3, willpower: 1 },
      },
      {
        text: 'Read a book or dive into a new topic online',
        weights: { intelligence: 3, dexterity: 1 },
      },
      { text: 'Call friends and plan something social', weights: { charisma: 3, vitality: 1 } },
      {
        text: 'Organize your space and plan the week ahead',
        weights: { dexterity: 3, willpower: 1 },
      },
      {
        text: 'Meditate, journal, and practice a quiet discipline',
        weights: { willpower: 3, intelligence: 1 },
      },
    ],
  },
  {
    scenario: 'You have a big deadline in 3 days. How do you approach it?',
    answers: [
      { text: 'Power through with intense focus sessions', weights: { strength: 2, willpower: 2 } },
      {
        text: 'Make sure I sleep and eat well so I can perform',
        weights: { vitality: 3, dexterity: 1 },
      },
      {
        text: 'Research the best strategy before starting',
        weights: { intelligence: 3, dexterity: 1 },
      },
      { text: 'Rally teammates and delegate tasks', weights: { charisma: 3, dexterity: 1 } },
      {
        text: 'Break it into milestones and time-block each one',
        weights: { dexterity: 3, intelligence: 1 },
      },
      {
        text: 'Commit to the grind — discipline over motivation',
        weights: { willpower: 3, strength: 1 },
      },
    ],
  },
  {
    scenario: 'What kind of personal growth excites you most right now?',
    answers: [
      { text: 'Getting physically stronger and more capable', weights: { strength: 4 } },
      { text: 'Building healthier habits and feeling my best', weights: { vitality: 4 } },
      { text: 'Learning new skills and expanding my knowledge', weights: { intelligence: 4 } },
      { text: 'Becoming a better communicator and leader', weights: { charisma: 4 } },
      { text: 'Being more productive and organized', weights: { dexterity: 4 } },
      { text: 'Building unshakeable discipline and mental strength', weights: { willpower: 4 } },
    ],
  },
  {
    scenario: 'You feel stressed after a tough day. What do you do?',
    answers: [
      {
        text: 'Work out — physical activity clears my head',
        weights: { strength: 3, vitality: 1 },
      },
      {
        text: 'Take a bath, make tea, and focus on recovery',
        weights: { vitality: 3, willpower: 1 },
      },
      {
        text: 'Analyze what went wrong and make a plan',
        weights: { intelligence: 2, dexterity: 2 },
      },
      { text: 'Talk it out with someone I trust', weights: { charisma: 3, vitality: 1 } },
      {
        text: 'Make a to-do list for tomorrow so I feel in control',
        weights: { dexterity: 3, willpower: 1 },
      },
      { text: 'Meditate or do breathing exercises', weights: { willpower: 3, vitality: 1 } },
    ],
  },
  {
    scenario: 'Which of these achievements would you be most proud of?',
    answers: [
      {
        text: 'Running a marathon or hitting a major fitness PR',
        weights: { strength: 3, willpower: 2 },
      },
      { text: 'Going a full year with no sick days', weights: { vitality: 4, willpower: 1 } },
      {
        text: 'Mastering a new language or complex skill',
        weights: { intelligence: 3, willpower: 2 },
      },
      {
        text: 'Giving a talk that moves an entire room',
        weights: { charisma: 4, intelligence: 1 },
      },
      {
        text: 'Launching a project from zero to completion',
        weights: { dexterity: 3, intelligence: 2 },
      },
      { text: 'Meditating every day for a year straight', weights: { willpower: 4, vitality: 1 } },
    ],
  },
  {
    scenario: 'A friend asks for advice. What topic do they usually come to you for?',
    answers: [
      { text: 'Fitness, workouts, or sports', weights: { strength: 4 } },
      { text: 'Health, nutrition, or wellness', weights: { vitality: 4 } },
      { text: 'Study tips, career, or technical problems', weights: { intelligence: 4 } },
      { text: 'Relationships, people skills, or networking', weights: { charisma: 4 } },
      { text: 'Productivity, organization, or time management', weights: { dexterity: 4 } },
      { text: 'Motivation, discipline, or mental toughness', weights: { willpower: 4 } },
    ],
  },
];

export interface QuizResult {
  scores: Record<StatName, number>;
  topStats: StatName[];
}

export function calculateQuizResults(answers: number[]): QuizResult {
  const scores: Record<StatName, number> = {
    strength: 0,
    vitality: 0,
    intelligence: 0,
    charisma: 0,
    dexterity: 0,
    willpower: 0,
  };

  for (let i = 0; i < answers.length; i++) {
    const question = QUIZ_QUESTIONS[i];
    if (!question) continue;
    const answer = question.answers[answers[i]];
    if (!answer) continue;
    for (const [stat, weight] of Object.entries(answer.weights)) {
      scores[stat as StatName] += weight;
    }
  }

  // Get top 3 stats
  const sorted = (Object.entries(scores) as [StatName, number][]).sort((a, b) => b[1] - a[1]);
  const topStats = sorted.slice(0, 3).map(([stat]) => stat);

  return { scores, topStats };
}
