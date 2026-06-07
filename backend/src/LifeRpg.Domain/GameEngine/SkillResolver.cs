using System.Text.RegularExpressions;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Skill unlock eligibility &amp; XP bonuses. Faithful port of the client's skillEngine.</summary>
public static partial class SkillResolver
{
    [GeneratedRegex(@"\+(\d+)%")]
    private static partial Regex PercentRegex();

    public static IReadOnlyList<SkillDefinition> GetNewlyUnlockedSkills(
        StatBlock statXp,
        IReadOnlySet<string> alreadyUnlocked)
    {
        var result = new List<SkillDefinition>();
        foreach (var skill in SkillDefinitions.All)
        {
            if (alreadyUnlocked.Contains(skill.Id))
            {
                continue;
            }

            if (IsSkillUnlockable(skill, statXp))
            {
                result.Add(skill);
            }
        }
        return result;
    }

    public static bool IsSkillUnlockable(SkillDefinition skill, StatBlock statXp)
    {
        if (skill.Category == SkillCategory.Cross)
        {
            return skill.RequiredStat is { } primary
                && skill.SecondaryStat is { } secondary
                && skill.SecondaryLevel is { } secondaryLevel
                && XpTable.LevelFromXp(statXp[primary]) >= skill.RequiredLevel
                && XpTable.LevelFromXp(statXp[secondary]) >= secondaryLevel;
        }

        return skill.RequiredStat is { } stat
            && XpTable.LevelFromXp(statXp[stat]) >= skill.RequiredLevel;
    }

    /// <summary>Total XP bonus percentage for a stat from AI-forged skills.</summary>
    public static int GetForgedBonusForStat(StatName stat, IEnumerable<GeneratedSkill> forged) =>
        forged.Where(s => s.Stat == stat).Sum(s => s.BonusPercent);

    /// <summary>Total XP bonus percentage for a stat from all unlocked skills.</summary>
    public static int GetSkillBonusForStat(StatName stat, IEnumerable<string> unlockedSkillIds)
    {
        var bonus = 0;
        foreach (var skillId in unlockedSkillIds)
        {
            var skill = SkillDefinitions.GetById(skillId);
            if (skill is null)
            {
                continue;
            }

            var match = PercentRegex().Match(skill.Effect);
            if (!match.Success)
            {
                continue;
            }

            var percent = int.Parse(match.Groups[1].Value);

            if (skill.Id == "cross-6")
            {
                // Zen Master applies to all stats.
                bonus += percent;
            }
            else if (skill.Category != SkillCategory.Cross && skill.RequiredStat == stat)
            {
                // Single-stat skill matching this stat.
                bonus += percent;
            }
            else if (skill.Category == SkillCategory.Cross)
            {
                if (skill.RequiredStat == stat || skill.SecondaryStat == stat)
                {
                    bonus += percent;
                }
            }
        }
        return bonus;
    }

    public static double GetSkillProgress(SkillDefinition skill, StatBlock statXp)
    {
        if (skill.RequiredStat is not { } primaryStat)
        {
            return 0;
        }

        var primaryLevel = XpTable.LevelFromXp(statXp[primaryStat]);
        var primaryProgress = Math.Min((double)primaryLevel / skill.RequiredLevel, 1);

        if (skill.Category == SkillCategory.Cross
            && skill.SecondaryStat is { } secondaryStat
            && skill.SecondaryLevel is { } secondaryLevel)
        {
            var secondaryLvl = XpTable.LevelFromXp(statXp[secondaryStat]);
            var secondaryProgress = Math.Min((double)secondaryLvl / secondaryLevel, 1);
            return (primaryProgress + secondaryProgress) / 2;
        }

        return primaryProgress;
    }
}
