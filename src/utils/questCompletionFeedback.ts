import { Quest } from '../types';
import { QuestCompletionFlowResult } from '../store/gameplayStore';
import { getQuestEvolutionState } from '../engine/questProgression';
import { getCurrentMilestone } from '../engine/streakEngine';
import { detectNewAchievements } from '../config/achievementTracker';
import { grantSagaOrChapterRewards } from '../config/progressionRewards';
import { useHeroStore } from '../store/heroStore';
import { useSettingsStore } from '../store/settingsStore';
import { STAT_COLORS } from '../types';
import { colors } from '../config/theme';
import { useUIStore } from '../store/uiStore';
import { playGameFeedback } from './gameFeedback';

/**
 * Shared post-completion theater used by Adventures and Home.
 * Cascades XP → evolution → level/tier/skill → appearance → achievements/streaks.
 */
export function presentQuestCompletionFeedback(
  priorQuest: Quest | undefined,
  result: QuestCompletionFlowResult,
): void {
  const haptic = useSettingsStore.getState().hapticEnabled;
  const {
    showXP,
    setLevelUp,
    setSkillUnlock,
    setTierUp,
    setAppearanceUnlock,
    setCharacterEvent,
    setEvolution,
    setAchievementUnlock,
    setStreakMilestone,
    pushFloater,
    triggerShake,
    markSkillSpark,
  } = useUIStore.getState();

  if (result.stepAdvancedOnly) {
    void playGameFeedback('bossPhase', haptic);
    triggerShake();
    pushFloater('HIT', STAT_COLORS[result.quest.stat]);
    setCharacterEvent('bossPhase');
    setTimeout(() => setCharacterEvent('idle'), 1500);
    return;
  }

  if (!result.completed) return;

  const priorEvolution = priorQuest ? getQuestEvolutionState(priorQuest) : null;

  void playGameFeedback('questComplete', haptic);
  showXP(result.quest.stat, result.xpAwarded);
  if (result.streakBonus && result.streakBonus > 0) {
    pushFloater(`STREAK +${result.streakBonus}`, colors.warning);
  }
  if (result.skillBonusPercent && result.skillBonusPercent > 0) {
    pushFloater(`SKILL +${result.skillBonusPercent}%`, colors.gold);
  } else if (result.skillBonus && result.skillBonus > 0) {
    pushFloater(`SKILL +${result.skillBonus}`, colors.gold);
  }
  if (result.quest.type === 'boss') triggerShake();
  setCharacterEvent('questComplete');
  setTimeout(() => setCharacterEvent('idle'), 1500);

  grantSagaOrChapterRewards(result.quest);

  if (priorQuest && priorQuest.title !== result.quest.title && priorEvolution?.nextRankName) {
    setTimeout(() => {
      void playGameFeedback('evolution', haptic);
      setEvolution(priorEvolution.nextRankName!, result.quest.title);
      setCharacterEvent('evolution');
      setTimeout(() => setCharacterEvent('idle'), 2000);
    }, 800);
  }

  if (result.levelResult) {
    const { stat, newLevel, tierUp } = result.levelResult;
    setTimeout(() => {
      void playGameFeedback('levelUp', haptic);
      setLevelUp(stat, newLevel);
    }, 1200);

    if (tierUp) {
      setTimeout(() => {
        void playGameFeedback('tierUp', haptic);
        setTierUp(tierUp.newTier, tierUp.newClass);
      }, 2500);
    }
  }

  if (result.newSkills.length > 0) {
    const unlocked = result.newSkills[0];
    setTimeout(() => {
      setSkillUnlock(unlocked);
      markSkillSpark(unlocked.id);
    }, result.levelResult ? 3000 : 1200);
  }

  if (result.appearanceUnlock) {
    const { shapes, sigils } = result.appearanceUnlock;
    const delay = result.levelResult ? 4000 : 2000;
    if (shapes.length > 0) {
      setTimeout(() => setAppearanceUnlock('shape', shapes[0]), delay);
    } else if (sigils.length > 0) {
      setTimeout(() => setAppearanceUnlock('sigil', sigils[0]), delay);
    }
  }

  setTimeout(() => {
    const hero = useHeroStore.getState().hero;
    if (!hero) return;

    const milestone = getCurrentMilestone(hero.currentStreak);
    if (milestone && hero.currentStreak === milestone.days) {
      setStreakMilestone(milestone.days, milestone.title, milestone.multiplier);
      void playGameFeedback('levelUp', haptic);
    }

    const newlyEarned = detectNewAchievements();
    if (newlyEarned.length > 0) {
      setTimeout(() => {
        setAchievementUnlock(newlyEarned[0]);
      }, 600);
    }
  }, result.levelResult ? 4500 : 2500);
}
