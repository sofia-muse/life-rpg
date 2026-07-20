// Applies an ApiHero (and optional quest list) into the local Zustand stores.
// Shared by session init, sync flush, and authoritative quest completion.
// Stores are required lazily to avoid cycles with syncManager ↔ hero/quest/settings stores.
import { ApiHero, ApiQuest } from './dto';
import { mapApiHero, mapApiQuest } from './mappers';

export function applyApiHeroSnapshot(apiHero: ApiHero, apiQuests?: ApiQuest[]): void {
  const { useHeroStore } = require('../store/heroStore') as typeof import('../store/heroStore');
  const { useSkillStore } = require('../store/skillStore') as typeof import('../store/skillStore');
  const { useSettingsStore } = require('../store/settingsStore') as typeof import('../store/settingsStore');

  useHeroStore.getState().setHero(mapApiHero(apiHero), { isOnboarded: true });
  useSkillStore.getState().replaceUnlockedSkills(apiHero.unlockedSkills);
  useSettingsStore.getState().replaceSettings(apiHero.settings);

  if (apiQuests) {
    const { useQuestStore } = require('../store/questStore') as typeof import('../store/questStore');
    useQuestStore.getState().replaceQuests(apiQuests.map(mapApiQuest));
  }
}
