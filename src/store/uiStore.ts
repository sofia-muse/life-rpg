import { create } from 'zustand';
import { Skill, StatName, ClassTier } from '../types';

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
  characterEvent: 'idle' | 'questComplete' | 'levelUp' | 'tierUp' | 'rest';

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
  setCharacterEvent: (event: 'idle' | 'questComplete' | 'levelUp' | 'tierUp' | 'rest') => void;
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
}));
