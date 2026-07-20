using LifeRpg.Domain.Enums;

namespace LifeRpg.Application.Common;

/// <summary>ISO-week-style Monday key and weekly path → quest XP bonus (matches client weeklyPaths).</summary>
public static class WeeklyPathHelper
{
    public const int AlignedQuestBonusPercent = 5;

    public static string WeekKey(DateOnly date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-diff).ToString("yyyy-MM-dd");
    }

    public static int GetQuestBonus(string? weeklyPath, string? weeklyPathWeekKey, StatName questStat, DateOnly today)
    {
        var path = weeklyPath?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(path) || weeklyPathWeekKey != WeekKey(today))
        {
            return 0;
        }

        var matches = path switch
        {
            "power" => questStat is StatName.Strength or StatName.Vitality,
            "focus" => questStat is StatName.Intelligence or StatName.Dexterity,
            "support" => questStat is StatName.Charisma or StatName.Willpower,
            _ => false,
        };

        return matches ? AlignedQuestBonusPercent : 0;
    }
}
