using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Skill unlock eligibility &amp; XP bonuses. Faithful port of the client's skillEngine.</summary>
public static partial class SkillResolver
{
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

    private static IEnumerable<SkillEffectDefinition> GetEffectsForUnlockedSkills(IEnumerable<string> unlockedSkillIds) =>
        unlockedSkillIds.SelectMany(SkillDefinitions.GetEffects);

    /// <summary>Total XP bonus percentage for a quest from all unlocked skills.</summary>
    public static int GetSkillBonusForQuest(QuestType type, StatName stat, IEnumerable<string> unlockedSkillIds)
    {
        var bonus = 0;
        foreach (var effect in GetEffectsForUnlockedSkills(unlockedSkillIds))
        {
            if (effect is not SkillEffectDefinition.QuestXpBonus questBonus)
            {
                continue;
            }

            if (questBonus.AppliesToAllQuests)
            {
                bonus += questBonus.Percent;
                continue;
            }

            if (questBonus.QuestTypes?.Contains(type) == true)
            {
                bonus += questBonus.Percent;
            }
            else if (questBonus.Stats?.Contains(stat) == true)
            {
                bonus += questBonus.Percent;
            }
        }
        return bonus;
    }

    /// <summary>Backwards-compatible stat-only helper for legacy call sites and tests.</summary>
    public static int GetSkillBonusForStat(StatName stat, IEnumerable<string> unlockedSkillIds) =>
        GetSkillBonusForQuest(QuestType.Daily, stat, unlockedSkillIds);

    public static int GetRestDayXpReward(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.RestDayXp>()
            .Where(effect => effect.Stat == StatName.Vitality)
            .Select(effect => effect.Amount)
            .DefaultIfEmpty(10)
            .Max();

    public static double GetStreakRetentionRatio(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.StreakRetention>()
            .Select(effect => effect.RetentionPercent / 100d)
            .DefaultIfEmpty(0)
            .Max();

    public static int GetWeeklyStreakFreezeAllowance(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.StreakFreeze>()
            .Select(effect => effect.MissesPerWeek)
            .DefaultIfEmpty(0)
            .Max();

    public static int GetActiveDailyQuestCapacityBonus(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.ActiveDailyQuestCapacity>()
            .Sum(effect => effect.AdditionalSlots);

    private static readonly IReadOnlyDictionary<QuestDifficulty, int> DifficultyRank =
        new Dictionary<QuestDifficulty, int>
        {
            [QuestDifficulty.Easy] = 0,
            [QuestDifficulty.Medium] = 1,
            [QuestDifficulty.Hard] = 2,
            [QuestDifficulty.Legendary] = 3,
        };

    /// <summary>Whether the hero may create/select a difficulty for a given stat (skill-gated).</summary>
    public static bool IsDifficultyAllowed(
        QuestDifficulty difficulty,
        StatName stat,
        IEnumerable<string> unlockedSkillIds)
    {
        if (DifficultyRank[difficulty] <= DifficultyRank[QuestDifficulty.Medium])
        {
            return true;
        }

        var unlocks = GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.DifficultyUnlock>()
            .Where(effect => effect.Stats is not { Count: > 0 } || effect.Stats.Contains(stat));

        return unlocks.Any(effect => DifficultyRank[effect.Difficulty] >= DifficultyRank[difficulty]);
    }

    public static int GetBossStepXpBonus(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.BossStepXp>()
            .Sum(effect => effect.Percent);

    public static int GetWeeklyCapacityBonus(IEnumerable<string> unlockedSkillIds) =>
        GetEffectsForUnlockedSkills(unlockedSkillIds)
            .OfType<SkillEffectDefinition.WeeklyCapacity>()
            .Sum(effect => effect.AdditionalSlots);

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
