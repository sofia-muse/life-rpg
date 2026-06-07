import { Skill, StatName } from '../types';
import { SKILLS, getSkillById, getForgedSkills } from '../config/skills';
import { levelFromXP } from '../config/xpTables';

// Check which skills should be unlocked based on current stats
export function getNewlyUnlockedSkills(
  statXP: Record<StatName, number>,
  alreadyUnlocked: string[],
): Skill[] {
  const newSkills: Skill[] = [];

  for (const skill of SKILLS) {
    if (alreadyUnlocked.includes(skill.id)) continue;

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

// Calculate total skill bonus for a given stat
export function getSkillBonusForStat(stat: StatName, unlockedSkillIds: string[]): number {
  // Resolve unlocked catalog skills + all AI-forged skills (forged skills are always active).
  const skills: Skill[] = [
    ...unlockedSkillIds.map((id) => getSkillById(id)).filter((s): s is Skill => !!s),
    ...getForgedSkills(),
  ];

  let bonus = 0;
  for (const skill of skills) {
    // Parse effect for XP bonus percentage
    const match = skill.effect.match(/\+(\d+)%/);
    if (!match) continue;

    const percent = parseInt(match[1], 10);

    // Check if skill applies to this stat
    if (skill.id === 'cross-6') {
      // Zen Master applies to all
      bonus += percent;
    } else if (skill.category === stat) {
      bonus += percent;
    } else if (skill.category === 'cross') {
      if (skill.requiredStat === stat || skill.secondaryStat === stat) {
        bonus += percent;
      }
    }
  }

  return bonus;
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
