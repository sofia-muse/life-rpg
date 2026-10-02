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

    /// <summary>Hero level blends the highest stat level with the mean of the rest.</summary>
    public static int CalculateHeroLevel(StatBlock statXp) =>
        XpTable.ComputeHeroLevel(GetStatLevels(statXp));

    /// <summary>Challenger must lead by a full level or 10% XP before the class stat moves.</summary>
    public const double DominantStatXpLead = 1.1;

    public static StatName ResolveClassStat(StatBlock statXp, StatName currentStat)
    {
        var levels = GetStatLevels(statXp);
        var currentLevel = levels[currentStat];
        var currentXp = statXp[currentStat];
        var xpLead = (int)Math.Floor(currentXp * DominantStatXpLead);
        var resolved = currentStat;

        foreach (var stat in Stats.All)
        {
            if (stat == currentStat)
            {
                continue;
            }

            var leadsByLevel = levels[stat] >= currentLevel + 1;
            var leadsByXp = statXp[stat] > currentXp && statXp[stat] >= xpLead;
            if ((leadsByLevel || leadsByXp) && statXp[stat] > statXp[resolved])
            {
                resolved = stat;
            }
        }

        return resolved;
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
