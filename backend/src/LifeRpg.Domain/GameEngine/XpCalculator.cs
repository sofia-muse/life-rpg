using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Domain.GameEngine;

public readonly record struct XpReward(int BaseXp, int StreakBonus, int SkillBonus, int TotalXp);

public readonly record struct XpApplication(int NewXp, int OldLevel, int NewLevel, bool DidLevelUp);

/// <summary>XP reward &amp; application. Faithful port of the client's xpEngine.</summary>
public static class XpCalculator
{
    public static XpReward CalculateXpReward(
        QuestDifficulty difficulty,
        double streakMultiplier,
        double skillBonusPercent = 0)
    {
        var baseXp = DifficultyXp.For(difficulty);
        var streakBonus = (int)Math.Floor(baseXp * (streakMultiplier - 1));
        var skillBonus = (int)Math.Floor(baseXp * (skillBonusPercent / 100));
        var totalXp = baseXp + streakBonus + skillBonus;
        return new XpReward(baseXp, streakBonus, skillBonus, totalXp);
    }

    public static XpApplication ApplyXp(int currentXp, int xpToAdd)
    {
        var oldLevel = XpTable.LevelFromXp(currentXp);
        var newXp = currentXp + xpToAdd;
        var newLevel = XpTable.LevelFromXp(newXp);
        return new XpApplication(newXp, oldLevel, newLevel, newLevel > oldLevel);
    }

    public static int GetRestDayXp(bool hasSecondWindSkill) => hasSecondWindSkill ? 15 : 10;
}
