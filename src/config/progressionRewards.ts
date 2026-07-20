import { CAMPAIGN_CHAPTERS } from './campaignChapters';
import { EQUIPPABLE_TITLES } from './achievements';
import { getBossSagaState } from '../engine/questProgression';
import { useJournalStore } from '../store/journalStore';
import { useSettingsStore } from '../store/settingsStore';
import { Quest } from '../types';

/** Map saga/chapter reward titles to equippable title ids when possible. */
function titleIdForLabel(label: string): string | null {
  const exact = EQUIPPABLE_TITLES.find((t) => t.label === label);
  if (exact) return exact.id;

  // Campaign / saga custom titles — store as unlocked custom labels via settings
  return null;
}

/**
 * When a boss quest completes, grant saga relic / campaign chapter reward titles
 * and journal the milestone. Config already declares rewardTitle; this closes the loop.
 */
export function grantSagaOrChapterRewards(quest: Quest): void {
  if (quest.type !== 'boss' || !quest.isCompleted) return;

  const settings = useSettingsStore.getState();
  const saga = getBossSagaState(quest);
  const chapter = quest.campaignChapterId
    ? CAMPAIGN_CHAPTERS.find((c) => c.id === quest.campaignChapterId)
    : CAMPAIGN_CHAPTERS.find((c) => c.bossTemplateTitle === quest.title);

  const rewardLabels = [
    saga?.rewardTitle,
    chapter?.rewardTitle,
  ].filter((t): t is string => !!t && t !== 'Campaign Relic');

  for (const label of rewardLabels) {
    const titleId = titleIdForLabel(label);
    if (titleId) {
      settings.unlockTitle(titleId);
      settings.setEquippedTitle(titleId);
    } else {
      // Persist custom campaign titles as unlocked labels + equip via custom id
      const customId = `custom:${label}`;
      settings.unlockTitle(customId, label);
      settings.setEquippedTitle(customId);
    }

    useJournalStore.getState().updateTodayEntry({
      milestones: [`Relic earned: ${label}`],
      narrative: `A relic was claimed — ${label}.`,
    });
  }
}
