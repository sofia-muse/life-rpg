import { DIFFICULTY_XP, Quest, QuestDifficulty } from '../types';

interface EvolutionStage {
  unlockAt: number;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  rankName: string;
}

interface EvolutionPath {
  id: string;
  stages: EvolutionStage[];
}

interface BossSagaBlueprint {
  sagaTitle: string;
  rewardTitle: string;
  phases: string[];
}

export interface QuestEvolutionState {
  rankName: string;
  currentStageIndex: number;
  totalStages: number;
  nextUnlockAt?: number;
  nextTitle?: string;
  nextRankName?: string;
}

export interface BossSagaState {
  sagaTitle: string;
  rewardTitle: string;
  phaseIndex: number;
  totalPhases: number;
  currentPhase: string;
  nextPhase?: string;
}

const EVOLUTION_PATHS: EvolutionPath[] = [
  {
    id: 'pushups',
    stages: [
      {
        unlockAt: 0,
        title: '20 Push-ups',
        description: 'Complete 20 push-ups to build upper body strength.',
        difficulty: 'easy',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: '30 Push-ups',
        description: 'Push the volume up and keep your form under control.',
        difficulty: 'medium',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: '50 Push-ups',
        description: 'Turn consistency into endurance with a high-volume set.',
        difficulty: 'hard',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: '100 Push-ups in a Day',
        description: 'Break the century mark with a day-long endurance challenge.',
        difficulty: 'legendary',
        rankName: 'Mythic',
      },
    ],
  },
  {
    id: 'hydration',
    stages: [
      {
        unlockAt: 0,
        title: 'Drink 8 Glasses of Water',
        description: 'Stay hydrated throughout the day.',
        difficulty: 'easy',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: 'Hydration Discipline',
        description: 'Hit your water goal before the evening slump arrives.',
        difficulty: 'easy',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: 'Hydration Guardian',
        description: 'Keep water intake steady and skip the sugary fallback drinks.',
        difficulty: 'medium',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: 'Perfect Hydration Week',
        description: 'Maintain disciplined hydration every day this week.',
        difficulty: 'hard',
        rankName: 'Mythic',
      },
    ],
  },
  {
    id: 'reading',
    stages: [
      {
        unlockAt: 0,
        title: 'Read for 30 Minutes',
        description: 'Read a book or educational article.',
        difficulty: 'medium',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: 'Read for 45 Minutes',
        description: 'Stay with one text long enough to hit true focus.',
        difficulty: 'medium',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: 'Deep Study Session',
        description: 'Read, annotate, and capture one key lesson in a single sitting.',
        difficulty: 'hard',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: 'Finish 3 Focused Reading Sessions',
        description: 'Complete three deliberate study blocks across the day.',
        difficulty: 'legendary',
        rankName: 'Mythic',
      },
    ],
  },
  {
    id: 'social',
    stages: [
      {
        unlockAt: 0,
        title: 'Reach Out to a Friend',
        description: 'Send a meaningful message to someone you care about.',
        difficulty: 'easy',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: 'Meaningful Check-In',
        description: 'Have a real, present conversation that goes past small talk.',
        difficulty: 'medium',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: 'Strengthen Your Circle',
        description: 'Reconnect intentionally and offer support where it matters.',
        difficulty: 'hard',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: 'Host a Catch-Up',
        description: 'Create the moment instead of waiting for it to happen.',
        difficulty: 'legendary',
        rankName: 'Mythic',
      },
    ],
  },
  {
    id: 'productivity',
    stages: [
      {
        unlockAt: 0,
        title: 'Complete Top 3 Tasks',
        description: 'Finish your three most important tasks today.',
        difficulty: 'medium',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: 'Complete Top 5 Tasks',
        description: 'Expand your execution window without losing focus.',
        difficulty: 'medium',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: 'Deep Focus Block',
        description: 'Clear a protected block to drive one important outcome forward.',
        difficulty: 'hard',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: 'Ship the Critical Path',
        description: 'Finish the tasks that move your project or day decisively forward.',
        difficulty: 'legendary',
        rankName: 'Mythic',
      },
    ],
  },
  {
    id: 'meditation',
    stages: [
      {
        unlockAt: 0,
        title: 'Meditate for 10 Minutes',
        description: 'Practice mindfulness meditation.',
        difficulty: 'medium',
        rankName: 'Initiate',
      },
      {
        unlockAt: 3,
        title: 'Meditate for 15 Minutes',
        description: 'Hold your focus a little longer when the mind wants to wander.',
        difficulty: 'medium',
        rankName: 'Adept',
      },
      {
        unlockAt: 7,
        title: 'Do the Hard Thing First',
        description: 'Face resistance early and let momentum carry the rest of the day.',
        difficulty: 'hard',
        rankName: 'Veteran',
      },
      {
        unlockAt: 14,
        title: 'Discipline Rite',
        description: 'Complete a composed morning ritual before the world starts pulling at you.',
        difficulty: 'legendary',
        rankName: 'Mythic',
      },
    ],
  },
];

const BOSS_SAGAS: Record<string, BossSagaBlueprint> = {
  'Couch to 5K': {
    sagaTitle: 'The Five-Kilometer Rite',
    rewardTitle: "Trailblazer's Crest",
    phases: ['Answer the Call', 'Build the Engine', 'Break the Wall', 'Cross the Finish'],
  },
  '30-Day Fitness Challenge': {
    sagaTitle: 'The Thirty-Day Crucible',
    rewardTitle: 'Champion of Momentum',
    phases: ['Initiation', 'Rhythm', 'Pressure', 'Ascension'],
  },
  'Build a Sleep Routine': {
    sagaTitle: 'The Moonlit Accord',
    rewardTitle: 'Keeper of Recovery',
    phases: ['Clear the Noise', 'Hold the Schedule', 'Stabilize the Night', 'Rise Rested'],
  },
  'Read 5 Books': {
    sagaTitle: "The Scholar's Pilgrimage",
    rewardTitle: 'Bearer of Five Tomes',
    phases: ['Open the Gate', 'Gather Insight', 'Endure the Middle', 'Claim Mastery'],
  },
  'Ship a Project': {
    sagaTitle: 'The Launch Campaign',
    rewardTitle: 'Builder of Finished Things',
    phases: ['Frame the Mission', 'Clear the Backlog', 'Ship the Core', 'Release the Work'],
  },
  '30-Day Meditation Streak': {
    sagaTitle: 'The Stillness Trial',
    rewardTitle: 'Warden of Resolve',
    phases: ['Settle the Noise', 'Deepen the Practice', 'Hold the Line', 'Walk in Stillness'],
  },
};

/** Resolve an evolution path id from a template/seed title (any stage title matches). */
export function resolveEvolutionPathId(title: string): string | undefined {
  const path = EVOLUTION_PATHS.find((p) => p.stages.some((stage) => stage.title === title));
  return path?.id;
}

function getEvolutionPath(quest: Quest): EvolutionPath | null {
  if (quest.evolutionPathId) {
    return EVOLUTION_PATHS.find((path) => path.id === quest.evolutionPathId) ?? null;
  }

  const seed = quest.templateTitle ?? quest.title;
  return (
    EVOLUTION_PATHS.find(
      (path) => path.stages.some((stage) => stage.title === seed || stage.title === quest.title),
    ) ?? null
  );
}

function getCurrentStageIndex(path: EvolutionPath, quest: Quest): number {
  const byTitle = path.stages.findIndex((stage) => stage.title === quest.title);
  if (byTitle !== -1) return byTitle;

  let index = 0;
  for (let i = 0; i < path.stages.length; i++) {
    if (quest.daysCompleted >= path.stages[i].unlockAt) {
      index = i;
    }
  }
  return index;
}

export function getQuestEvolutionState(quest: Quest): QuestEvolutionState | null {
  if (quest.type !== 'daily') return null;

  const path = getEvolutionPath(quest);
  if (!path) return null;

  const currentStageIndex = getCurrentStageIndex(path, quest);
  const currentStage = path.stages[currentStageIndex];
  const nextStage = path.stages[currentStageIndex + 1];

  return {
    rankName: currentStage.rankName,
    currentStageIndex,
    totalStages: path.stages.length,
    nextUnlockAt: nextStage?.unlockAt,
    nextTitle: nextStage?.title,
    nextRankName: nextStage?.rankName,
  };
}

export function applyQuestEvolution(quest: Quest): Quest {
  const path = getEvolutionPath(quest);
  if (!path) return quest;

  const currentStageIndex = getCurrentStageIndex(path, quest);
  const nextStage = path.stages[currentStageIndex + 1];
  if (!nextStage || quest.daysCompleted < nextStage.unlockAt) {
    return {
      ...quest,
      evolutionPathId: quest.evolutionPathId ?? path.id,
    };
  }

  return {
    ...quest,
    evolutionPathId: path.id,
    title: nextStage.title,
    description: nextStage.description,
    difficulty: nextStage.difficulty,
    xpReward: DIFFICULTY_XP[nextStage.difficulty],
  };
}

export function getBossSagaState(quest: Quest): BossSagaState | null {
  if (quest.type !== 'boss' || !quest.totalSteps) return null;

  const blueprint = BOSS_SAGAS[quest.title] ?? {
    sagaTitle: `${quest.title} Campaign`,
    rewardTitle: 'Campaign Relic',
    phases: ['Preparation', 'Pressure', 'Breakthrough', 'Triumph'],
  };

  const ratio = Math.min((quest.completedSteps || 0) / quest.totalSteps, 0.999);
  const phaseIndex = Math.min(
    blueprint.phases.length - 1,
    Math.floor(ratio * blueprint.phases.length),
  );

  return {
    sagaTitle: blueprint.sagaTitle,
    rewardTitle: blueprint.rewardTitle,
    phaseIndex,
    totalPhases: blueprint.phases.length,
    currentPhase: blueprint.phases[phaseIndex],
    nextPhase: blueprint.phases[phaseIndex + 1],
  };
}

export function getLeadingEvolutionQuest(quests: Quest[]): Quest | null {
  const evolving = quests
    .filter((quest) => !quest.isCompleted && quest.isActive)
    .map((quest) => ({ quest, evolution: getQuestEvolutionState(quest) }))
    .filter(
      (
        entry,
      ): entry is { quest: Quest; evolution: QuestEvolutionState & { nextUnlockAt: number } } =>
        !!entry.evolution?.nextUnlockAt,
    )
    .sort(
      (a, b) =>
        a.evolution.nextUnlockAt -
        a.quest.daysCompleted -
        (b.evolution.nextUnlockAt - b.quest.daysCompleted),
    );

  return evolving[0]?.quest ?? null;
}
