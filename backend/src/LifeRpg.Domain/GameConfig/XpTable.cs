using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameConfig;

/// <summary>
/// XP curve. Faithful port of the client's <c>src/config/xpTables.ts</c>.
/// XP to finish a level is floor(14 * level^0.8), paced for a few real quests a day.
/// </summary>
public static class XpTable
{
    private const int BaseXp = 14;
    private const double XpExponent = 0.8;
    public const int MaxLevel = 100;
    public const double HeroLevelDominantWeight = 0.6;
    public const double HeroLevelOtherWeight = 0.4;

    public static int XpForLevel(int level) => (int)Math.Floor(BaseXp * Math.Pow(level, XpExponent));

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

    /// <summary>
    /// Hero level = floor(0.6 * highest stat level + 0.4 * mean of the other five), min 1.
    /// </summary>
    public static int ComputeHeroLevel(StatBlock statLevels)
    {
        var values = statLevels.Values().ToArray();
        var dominant = values.Max();
        var othersMean = (values.Sum() - dominant) / 5d;
        var blended = HeroLevelDominantWeight * dominant + HeroLevelOtherWeight * othersMean;
        return Math.Max(1, (int)Math.Floor(blended));
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
