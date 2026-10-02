import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { LevelUpModal } from './LevelUpModal';
import { SkillUnlockModal } from './SkillUnlockModal';
import { TierUpModal } from './TierUpModal';
import { QuestCreateModal } from './QuestCreateModal';
import { AppearanceUnlockModal } from './AppearanceUnlockModal';
import { EvolutionModal } from './EvolutionModal';
import { AchievementUnlockModal } from './AchievementUnlockModal';
import { StreakMilestoneModal } from './StreakMilestoneModal';

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
    showAchievementModal,
    achievementData,
    dismissAchievement,
    showStreakMilestoneModal,
    streakMilestoneData,
    dismissStreakMilestone,
  } = useUIStore();

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

      <AchievementUnlockModal
        visible={showAchievementModal}
        achievement={achievementData}
        onDismiss={dismissAchievement}
      />

      {streakMilestoneData && (
        <StreakMilestoneModal
          visible={showStreakMilestoneModal}
          days={streakMilestoneData.days}
          title={streakMilestoneData.title}
          multiplier={streakMilestoneData.multiplier}
          onDismiss={dismissStreakMilestone}
        />
      )}
    </>
  );
}
