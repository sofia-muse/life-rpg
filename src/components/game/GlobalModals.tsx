import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/uiStore';
import { LevelUpModal } from './LevelUpModal';
import { SkillUnlockModal } from './SkillUnlockModal';
import { TierUpModal } from './TierUpModal';
import { QuestCreateModal } from './QuestCreateModal';
import { AppearanceUnlockModal } from './AppearanceUnlockModal';

import { EvolutionModal } from './EvolutionModal';

export function GlobalModals() {
  const {
    showLevelUpModal,
    levelUpData,
    dismissLevelUp,
    showSkillUnlockModal,
    skillUnlockData,
    dismissSkillUnlock,
    showTierUpModal,
    tierUpData,
    dismissTierUp,
    showAppearanceUnlock,
    appearanceUnlockData,
    dismissAppearanceUnlock,
    showEvolutionModal,
    evolutionData,
    dismissEvolution,
  } = useUIStore(
    useShallow((s) => ({
      showLevelUpModal: s.showLevelUpModal,
      levelUpData: s.levelUpData,
      dismissLevelUp: s.dismissLevelUp,
      showSkillUnlockModal: s.showSkillUnlockModal,
      skillUnlockData: s.skillUnlockData,
      dismissSkillUnlock: s.dismissSkillUnlock,
      showTierUpModal: s.showTierUpModal,
      tierUpData: s.tierUpData,
      dismissTierUp: s.dismissTierUp,
      showAppearanceUnlock: s.showAppearanceUnlock,
      appearanceUnlockData: s.appearanceUnlockData,
      dismissAppearanceUnlock: s.dismissAppearanceUnlock,
      showEvolutionModal: s.showEvolutionModal,
      evolutionData: s.evolutionData,
      dismissEvolution: s.dismissEvolution,
    })),
  );

  return (
    <>
      {levelUpData && (
        <LevelUpModal
          visible={showLevelUpModal}
          stat={levelUpData.stat}
          newLevel={levelUpData.newLevel}
          onDismiss={dismissLevelUp}
        />
      )}

      <SkillUnlockModal
        visible={showSkillUnlockModal}
        skill={skillUnlockData}
        onDismiss={dismissSkillUnlock}
      />

      {tierUpData && (
        <TierUpModal
          visible={showTierUpModal}
          newTier={tierUpData.newTier}
          newClass={tierUpData.newClass}
          onDismiss={dismissTierUp}
        />
      )}

      <QuestCreateModal />

      {appearanceUnlockData && (
        <AppearanceUnlockModal
          visible={showAppearanceUnlock}
          type={appearanceUnlockData.type}
          name={appearanceUnlockData.name}
          onDismiss={dismissAppearanceUnlock}
        />
      )}

      {evolutionData && (
        <EvolutionModal
          visible={showEvolutionModal}
          rankName={evolutionData.rankName}
          nextTitle={evolutionData.nextTitle}
          onDismiss={dismissEvolution}
        />
      )}
    </>
  );
}
