using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Domain.GameEngine;

public readonly record struct XpReward(
    int BaseXp,
    int StreakBonus,
    int SkillBonus,
    int TotalXp,
    int HeroStreakBonus = 0,
    int QuestStreakBonus = 0);

public readonly record struct XpApplication(int NewXp, int OldLevel, int NewLevel, bool DidLevelUp);

/// <summary>XP reward &amp; application. Faithful port of the client's xpEngine.</summary>
public static class XpCalculator
{
    public static XpReward CalculateXpReward(
        QuestDifficulty difficulty,
        double heroStreakMultiplier,
        double skillBonusPercent = 0,
        double questStreakMultiplier = 1)
    {
        var baseXp = DifficultyXp.For(difficulty);
        var heroStreakBonus = BonusFromMultiplier(baseXp, heroStreakMultiplier);
        var questStreakBonus = BonusFromMultiplier(baseXp, questStreakMultiplier);
        var streakBonus = heroStreakBonus + questStreakBonus;
        var skillBonus = (int)Math.Floor(baseXp * (skillBonusPercent / 100));
        var totalXp = baseXp + streakBonus + skillBonus;
        return new XpReward(baseXp, streakBonus, skillBonus, totalXp, heroStreakBonus, questStreakBonus);
    }

    /// <summary>
    /// Extra XP from a multiplier. floor(base * multiplier) - base avoids the binary
    /// error in (multiplier - 1), where 1.2 - 1 is 0.1999….
    /// </summary>
    private static int BonusFromMultiplier(int baseXp, double multiplier)
    {
        if (multiplier <= 1d)
        {
            return 0;
        }

        return (int)Math.Floor(baseXp * multiplier + 1e-9) - baseXp;
    }

    /// <summary>One boss step's share of a full reward. The last step keeps the remainder.</summary>
    public static int BossStepShare(int totalXp, int totalSteps, int completedStep)
    {
        var steps = Math.Max(1, totalSteps);
        if (steps == 1)
        {
            return totalXp;
        }

        var share = totalXp / steps;
        var step = Math.Clamp(completedStep, 1, steps);
        return step == steps ? totalXp - share * (steps - 1) : share;
    }

    public static XpApplication ApplyXp(int currentXp, int xpToAdd)
    {
        var oldLevel = XpTable.LevelFromXp(currentXp);
        var newXp = currentXp + xpToAdd;
        var newLevel = XpTable.LevelFromXp(newXp);
        return new XpApplication(newXp, oldLevel, newLevel, newLevel > oldLevel);
    }

    /// <summary>Rest-day vitality XP. Skill sets the base; each vitality level adds 1.</summary>
    public static int GetRestDayXp(bool hasSecondWindSkill, int vitalityLevel = 0) =>
        (hasSecondWindSkill ? 15 : 10) + Math.Max(0, vitalityLevel);
}
