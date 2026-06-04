using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameConfig;

/// <summary>
/// XP curve. Faithful port of the client's <c>src/config/xpTables.ts</c>.
/// XP required for a level follows baseXP * level^1.5 (baseXP = 100).
/// </summary>
public static class XpTable
{
    private const int BaseXp = 100;
    public const int MaxLevel = 100;

    public static int XpForLevel(int level) => (int)Math.Floor(BaseXp * Math.Pow(level, 1.5));

    public static int TotalXpForLevel(int level)
    {
        var total = 0;
        for (var i = 1; i <= level; i++)
        {
            total += XpForLevel(i);
        }
        return total;
    }

    /// <summary>Current level given accumulated total XP (matches client levelFromXP).</summary>
    public static int LevelFromXp(int totalXp)
    {
        var accumulated = 0;
        for (var level = 1; level <= MaxLevel; level++)
        {
            accumulated += XpForLevel(level);
            if (totalXp < accumulated)
            {
                return level - 1;
            }
        }
        return MaxLevel;
    }

    /// <summary>Hero level = floor(average of stat levels), min 1 (matches client calculateHeroLevel).</summary>
    public static int ComputeHeroLevel(StatBlock statLevels)
    {
        var sum = statLevels.Values().Sum();
        return Math.Max(1, sum / 6);
    }

    public static (int CurrentLevelXp, int XpNeeded, double Progress) XpProgressInLevel(int totalXp)
    {
        var level = LevelFromXp(totalXp);
        var xpAtLevelStart = TotalXpForLevel(level);
        var xpNeeded = XpForLevel(level + 1);
        var currentLevelXp = totalXp - xpAtLevelStart;
        var progress = xpNeeded > 0 ? Math.Min((double)currentLevelXp / xpNeeded, 1) : 1;
        return (currentLevelXp, xpNeeded, progress);
    }
}
