using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Stat &amp; hero-level computation. Faithful port of the client's statEngine.</summary>
public static class StatCalculator
{
    /// <summary>Computed levels for all stats from their XP totals.</summary>
    public static StatBlock GetStatLevels(StatBlock statXp)
    {
        var levels = new StatBlock();
        foreach (var stat in Stats.All)
        {
            levels[stat] = XpTable.LevelFromXp(statXp[stat]);
        }
        return levels;
    }

    /// <summary>Hero level = max(1, floor(sum(stat levels) / 6)).</summary>
    public static int CalculateHeroLevel(StatBlock statXp)
    {
        var sum = GetStatLevels(statXp).Values().Sum();
        return Math.Max(1, sum / 6);
    }

    /// <summary>Dominant stat = highest XP, scanning in canonical order with strict &gt; (matches client).</summary>
    public static StatName GetDominantStat(StatBlock statXp)
    {
        var dominant = StatName.Strength;
        var maxXp = 0;
        foreach (var stat in Stats.All)
        {
            if (statXp[stat] > maxXp)
            {
                maxXp = statXp[stat];
                dominant = stat;
            }
        }
        return dominant;
    }

    /// <summary>Stat block of levels (alias of GetStatLevels, mirrors client getStatBlock).</summary>
    public static StatBlock GetStatBlock(StatBlock statXp) => GetStatLevels(statXp);
}
