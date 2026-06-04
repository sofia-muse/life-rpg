namespace LifeRpg.Domain.Enums;

/// <summary>The six RPG stats. Order matches the client's STAT_NAMES.</summary>
public enum StatName
{
    Strength,
    Vitality,
    Intelligence,
    Charisma,
    Dexterity,
    Willpower,
}

public static class Stats
{
    /// <summary>All stats in canonical order (mirrors the client's STAT_NAMES).</summary>
    public static readonly IReadOnlyList<StatName> All = new[]
    {
        StatName.Strength,
        StatName.Vitality,
        StatName.Intelligence,
        StatName.Charisma,
        StatName.Dexterity,
        StatName.Willpower,
    };
}
