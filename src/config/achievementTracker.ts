import { AchievementDefinition, buildAchievementContext, getEarnedAchievements } from './achievements';
import { useForgedSkillStore } from '../store/forgedSkillStore';
import { useHeroStore } from '../store/heroStore';
import { useQuestStore } from '../store/questStore';
import { useRaidStore } from '../store/raidStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSkillStore } from '../store/skillStore';

/** Returns newly earned achievements since last celebration, and marks them seen. */
export function detectNewAchievements(): AchievementDefinition[] {
  const hero = useHeroStore.getState().hero;
  if (!hero) return [];

  const settings = useSettingsStore.getState();
  const raidPersonal = useRaidStore.getState().personal;
  const ctx = buildAchievementContext(
    hero,
    useQuestStore.getState().quests,
    useSkillStore.getState().getUnlockedSkillIds().length,
    useForgedSkillStore.getState().forged.length,
    settings,
    settings.weeklyContractsCompleted,
    {
      raidsCleared: raidPersonal.raidsCleared,
      totalContribution: raidPersonal.totalContribution,
      bestContributionShare: raidPersonal.bestContributionShare,
    },
  );

  const earned = getEarnedAchievements(ctx);
  const seen = new Set(settings.seenAchievementIds ?? []);
  const newly = earned.filter((a) => !seen.has(a.id));

  if (newly.length > 0) {
    useSettingsStore.getState().markAchievementsSeen(newly.map((a) => a.id));
  }

  return newly;
}
