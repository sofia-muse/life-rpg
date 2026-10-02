import { QuestDifficulty, QuestType, Skill, SkillEffect, StatName } from '../types';
import { SKILLS, getSkillById, getForgedSkills } from '../config/skills';
import { levelFromXP } from '../config/xpTables';

function normalizeUnlockedSkillIds(unlockedSkillIds: unknown, context: string): string[] {
  if (!Array.isArray(unlockedSkillIds)) {
    console.warn('[SkillEngine] Expected unlocked skill ids to be an array.', {
      context,
      received: unlockedSkillIds,
    });
    return [];
  }

  return unlockedSkillIds.filter((skillId): skillId is string => typeof skillId === 'string');
}

// Check which skills should be unlocked based on current stats
export function getNewlyUnlockedSkills(
  statXP: Record<StatName, number>,
  alreadyUnlocked: string[],
): Skill[] {
  const newSkills: Skill[] = [];
  const unlockedSkillIds = normalizeUnlockedSkillIds(alreadyUnlocked, 'getNewlyUnlockedSkills');

  for (const skill of SKILLS) {
    if (unlockedSkillIds.includes(skill.id)) continue;

    if (skill.category === 'cross') {
      // Cross-stat skills require two stats
      if (
        skill.requiredStat &&
        skill.secondaryStat &&
        skill.secondaryLevel &&
        levelFromXP(statXP[skill.requiredStat]) >= skill.requiredLevel &&
        levelFromXP(statXP[skill.secondaryStat]) >= skill.secondaryLevel
      ) {
        newSkills.push(skill);
      }
    } else {
      // Single stat skills
      if (skill.requiredStat && levelFromXP(statXP[skill.requiredStat]) >= skill.requiredLevel) {
        newSkills.push(skill);
      }
    }
  }

  return newSkills;
}

// Check if a specific skill is unlocked
export function isSkillUnlockable(skill: Skill, statXP: Record<StatName, number>): boolean {
  if (skill.category === 'cross') {
    return (
      !!skill.requiredStat &&
      !!skill.secondaryStat &&
      !!skill.secondaryLevel &&
      levelFromXP(statXP[skill.requiredStat]) >= skill.requiredLevel &&
      levelFromXP(statXP[skill.secondaryStat]) >= skill.secondaryLevel
    );
  }
  return !!skill.requiredStat && levelFromXP(statXP[skill.requiredStat]) >= skill.requiredLevel;
}

function getResolvedSkills(unlockedSkillIds: string[]): Skill[] {
  const normalizedSkillIds = normalizeUnlockedSkillIds(unlockedSkillIds, 'getResolvedSkills');
  return [
    ...normalizedSkillIds.map((id) => getSkillById(id)).filter((s): s is Skill => !!s),
    ...getForgedSkills(),
  ];
}

function isQuestXpEffect(
  effect: SkillEffect,
): effect is Extract<SkillEffect, { type: 'questXpBonus' }> {
  return effect.type === 'questXpBonus';
}

function appliesToQuest(effect: Extract<SkillEffect, { type: 'questXpBonus' }>, quest: {
  stat: StatName;
  type: QuestType;
}): boolean {
  if (effect.appliesToAllQuests) return true;
  if (effect.questTypes?.includes(quest.type)) return true;
  if (effect.stats?.includes(quest.stat)) return true;
  return false;
}

function findSkillEffects<TType extends SkillEffect['type']>(
  unlockedSkillIds: string[],
  type: TType,
): Extract<SkillEffect, { type: TType }>[] {
  const effects: Extract<SkillEffect, { type: TType }>[] = [];
  for (const skill of getResolvedSkills(unlockedSkillIds)) {
    for (const effect of skill.effects) {
      if (effect.type === type) {
        effects.push(effect as Extract<SkillEffect, { type: TType }>);
      }
    }
  }
  return effects;
}

export function getQuestSkillBonus(
  quest: { stat: StatName; type: QuestType },
  unlockedSkillIds: string[],
): number {
  let bonus = 0;
  for (const skill of getResolvedSkills(unlockedSkillIds)) {
    for (const effect of skill.effects) {
      if (isQuestXpEffect(effect) && appliesToQuest(effect, quest)) {
        bonus += effect.percent;
      }
    }
  }
  return bonus;
}

// Backwards-compatible stat-only helper for older call sites and tests.
export function getSkillBonusForStat(stat: StatName, unlockedSkillIds: string[]): number {
  return getQuestSkillBonus({ stat, type: 'daily' }, unlockedSkillIds);
}

export function getRestDayXpReward(unlockedSkillIds: string[]): number {
  const bonuses = findSkillEffects(unlockedSkillIds, 'restDayXp').filter(
    (effect) => effect.stat === 'vitality',
  );
  return bonuses.reduce((max, effect) => Math.max(max, effect.amount), 10);
}

export function getStreakRetentionRatio(unlockedSkillIds: string[]): number {
  const effects = findSkillEffects(unlockedSkillIds, 'streakRetention');
  return effects.reduce((max, effect) => Math.max(max, effect.retentionPercent / 100), 0);
}

export function getWeeklyStreakFreezeAllowance(unlockedSkillIds: string[]): number {
  return findSkillEffects(unlockedSkillIds, 'streakFreeze').reduce(
    (max, effect) => Math.max(max, effect.missesPerWeek),
    0,
  );
}

export function getActiveDailyQuestCapacityBonus(unlockedSkillIds: string[]): number {
  return findSkillEffects(unlockedSkillIds, 'activeDailyQuestCapacity').reduce(
    (sum, effect) => sum + effect.additionalSlots,
    0,
  );
}

const DIFFICULTY_RANK: Record<QuestDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  legendary: 3,
};

/** Whether the hero may create/select a difficulty for a given stat (skill-gated). */
export function isDifficultyAllowed(
  difficulty: QuestDifficulty,
  stat: StatName,
  unlockedSkillIds: string[],
): boolean {
  if (DIFFICULTY_RANK[difficulty] <= DIFFICULTY_RANK.medium) {
    return true;
  }

  const unlocks = findSkillEffects(unlockedSkillIds, 'difficultyUnlock').filter(
    (effect) => !effect.stats?.length || effect.stats.includes(stat),
  );

  return unlocks.some((effect) => DIFFICULTY_RANK[effect.difficulty] >= DIFFICULTY_RANK[difficulty]);
}

export function getBossStepXpBonus(unlockedSkillIds: string[]): number {
  return findSkillEffects(unlockedSkillIds, 'bossStepXp').reduce(
    (sum, effect) => sum + effect.percent,
    0,
  );
}

export function getWeeklyCapacityBonus(unlockedSkillIds: string[]): number {
  return findSkillEffects(unlockedSkillIds, 'weeklyCapacity').reduce(
    (sum, effect) => sum + effect.additionalSlots,
    0,
  );
}

// Get progress toward a skill (0-1)
export function getSkillProgress(skill: Skill, statXP: Record<StatName, number>): number {
  if (!skill.requiredStat) return 0;

  const primaryLevel = levelFromXP(statXP[skill.requiredStat]);
  const primaryProgress = Math.min(primaryLevel / skill.requiredLevel, 1);

  if (skill.category === 'cross' && skill.secondaryStat && skill.secondaryLevel) {
    const secondaryLevel = levelFromXP(statXP[skill.secondaryStat]);
    const secondaryProgress = Math.min(secondaryLevel / skill.secondaryLevel, 1);
    return (primaryProgress + secondaryProgress) / 2;
  }

  return primaryProgress;
}
