import { Quest, StatName } from '../types';
import { getQuestDisplayTitle, getQuestDisplayDescription } from '../config/questFlavor';

export type QuestStatus = 'all' | 'ready' | 'completed' | 'paused';

export function filterQuests(
  quests: Quest[],
  query: string,
  stat: StatName | 'all',
  status: QuestStatus,
  fantasyNames = false,
): Quest[] {
  const search = query.trim().toLocaleLowerCase();
  return quests.filter((quest) => {
    if (stat !== 'all' && quest.stat !== stat) return false;
    if (status === 'ready' && (!quest.isActive || quest.isCompleted)) return false;
    if (status === 'completed' && !quest.isCompleted) return false;
    if (status === 'paused' && (quest.isActive || quest.isCompleted)) return false;
    return (
      !search ||
      [
        quest.title,
        quest.description,
        getQuestDisplayTitle(quest, fantasyNames),
        getQuestDisplayDescription(quest, fantasyNames),
      ].some((text) => text.toLocaleLowerCase().includes(search))
    );
  });
}
