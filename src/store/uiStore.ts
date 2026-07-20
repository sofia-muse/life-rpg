import { create } from 'zustand';
import { Skill, StatName, ClassTier } from '../types';
import { AchievementDefinition } from '../config/achievements';

interface UIState {
  showLevelUpModal: boolean;
  levelUpData: { stat: StatName; newLevel: number } | null;
  showSkillUnlockModal: boolean;
  skillUnlockData: Skill | null;
  showTierUpModal: boolean;
  tierUpData: { newTier: ClassTier; newClass: string } | null;
  showXPPopup: boolean;
  xpPopupData: { stat: StatName; amount: number } | null;
  showQuestCreateModal: boolean;
  showAppearanceUnlock: boolean;
  appearanceUnlockData: { type: 'shape' | 'sigil'; name: string } | null;
  characterEvent: 'idle' | 'questComplete' | 'levelUp' | 'tierUp' | 'rest' | 'bossPhase' | 'evolution' | 'contractComplete';
  showEvolutionModal: boolean;
  evolutionData: { rankName: string; nextTitle?: string } | null;
  showAchievementModal: boolean;
  achievementData: AchievementDefinition | null;
  showStreakMilestoneModal: boolean;
  streakMilestoneData: { days: number; title: string; multiplier: number } | null;

  setLevelUp: (stat: StatName, newLevel: number) => void;
  setSkillUnlock: (skill: Skill) => void;
  setTierUp: (newTier: ClassTier, newClass: string) => void;
  showXP: (stat: StatName, amount: number) => void;
  dismissLevelUp: () => void;
  dismissSkillUnlock: () => void;
  dismissTierUp: () => void;
  dismissXP: () => void;
  setQuestCreateModal: (show: boolean) => void;
  setAppearanceUnlock: (type: 'shape' | 'sigil', name: string) => void;
  dismissAppearanceUnlock: () => void;
  setCharacterEvent: (event: UIState['characterEvent']) => void;
  setEvolution: (rankName: string, nextTitle?: string) => void;
  dismissEvolution: () => void;
  setAchievementUnlock: (achievement: AchievementDefinition) => void;
  dismissAchievement: () => void;
  setStreakMilestone: (days: number, title: string, multiplier: number) => void;
  dismissStreakMilestone: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showLevelUpModal: false,
  levelUpData: null,
  showSkillUnlockModal: false,
  skillUnlockData: null,
  showTierUpModal: false,
  tierUpData: null,
  showXPPopup: false,
  xpPopupData: null,
  showQuestCreateModal: false,
  showAppearanceUnlock: false,
  appearanceUnlockData: null,
  characterEvent: 'idle' as const,
  showEvolutionModal: false,
  evolutionData: null,
  showAchievementModal: false,
  achievementData: null,
  showStreakMilestoneModal: false,
  streakMilestoneData: null,

  setLevelUp: (stat, newLevel) => set({ showLevelUpModal: true, levelUpData: { stat, newLevel } }),

  setSkillUnlock: (skill) => set({ showSkillUnlockModal: true, skillUnlockData: skill }),

  setTierUp: (newTier, newClass) =>
    set({ showTierUpModal: true, tierUpData: { newTier, newClass } }),

  showXP: (stat, amount) => set({ showXPPopup: true, xpPopupData: { stat, amount } }),

  dismissLevelUp: () => set({ showLevelUpModal: false, levelUpData: null }),

  dismissSkillUnlock: () => set({ showSkillUnlockModal: false, skillUnlockData: null }),

  dismissTierUp: () => set({ showTierUpModal: false, tierUpData: null }),

  dismissXP: () => set({ showXPPopup: false, xpPopupData: null }),

  setQuestCreateModal: (show) => set({ showQuestCreateModal: show }),

  setAppearanceUnlock: (type, name) =>
    set({ showAppearanceUnlock: true, appearanceUnlockData: { type, name } }),

  dismissAppearanceUnlock: () => set({ showAppearanceUnlock: false, appearanceUnlockData: null }),

  setCharacterEvent: (event) => set({ characterEvent: event }),

  setEvolution: (rankName, nextTitle) =>
    set({ showEvolutionModal: true, evolutionData: { rankName, nextTitle } }),

  dismissEvolution: () => set({ showEvolutionModal: false, evolutionData: null }),

  setAchievementUnlock: (achievement) =>
    set({ showAchievementModal: true, achievementData: achievement }),

  dismissAchievement: () => set({ showAchievementModal: false, achievementData: null }),

  setStreakMilestone: (days, title, multiplier) =>
    set({
      showStreakMilestoneModal: true,
      streakMilestoneData: { days, title, multiplier },
    }),

  dismissStreakMilestone: () =>
    set({ showStreakMilestoneModal: false, streakMilestoneData: null }),
}));
